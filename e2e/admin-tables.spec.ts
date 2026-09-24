// F1-4b: admin creates, opens and closes a table through the real app.
// Same prerequisites as admin-lifecycle.spec.ts (app running, seeded admin).
import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// The seed uses 1-3 and other tests 900-903. There is no delete feature in the
// UI, so a random number keeps reruns independent; cleanup below is best effort.
const tableNumber = 100 + Math.floor(Math.random() * 800);

// Best-effort cleanup with the local service-role key (bypasses RLS). Deleting the
// table removes its sessions too (table_sessions cascades from dining_tables).
async function deleteTable(number: number): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return;
  // Service-role key + delete: never allowed against anything but the local stack.
  const { hostname } = new URL(SUPABASE_URL);
  if (hostname !== "localhost" && hostname !== "127.0.0.1") return;
  const headers = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  const found = await fetch(`${SUPABASE_URL}/rest/v1/dining_tables?table_number=eq.${number}&select=id`, { headers });
  if (!found.ok) return;
  const rows: { id: string }[] = await found.json();
  for (const { id } of rows) {
    await fetch(`${SUPABASE_URL}/rest/v1/dining_tables?id=eq.${id}`, { method: "DELETE", headers });
  }
}

test.afterEach(async () => {
  await deleteTable(tableNumber);
});

test("admin creates a table, sees its link, opens it, closes it, and cannot duplicate the number", async ({
  page,
  baseURL,
}) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "ADMIN_EMAIL / ADMIN_PASSWORD must be set in .env.local");

  // Real login.
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(ADMIN_EMAIL!);
  await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("Abrí y cerrá mesas y copiá el link de cada una.")).toBeVisible();

  // Reach the page through the nav.
  await page.getByRole("link", { name: "Mesas" }).first().click();
  await expect(page).toHaveURL(/\/admin\/tables$/);
  await expect(page.getByRole("heading", { name: "Mesas" })).toBeVisible();

  // Create.
  await page.getByLabel("Número de mesa").fill(String(tableNumber));
  await page.getByRole("button", { name: "Crear mesa" }).click();
  await expect(page.getByText("Mesa creada")).toBeVisible();

  const row = page.locator("li", { hasText: `Mesa ${tableNumber}` });
  await expect(row.getByText("Cerrada")).toBeVisible();

  // Absolute link /t/<token> on the app's own origin.
  const link = row.getByRole("link");
  const href = await link.getAttribute("href");
  const url = new URL(href!);
  expect(url.origin).toBe(new URL(baseURL!).origin);
  expect(url.pathname).toMatch(/^\/t\/[^/]+$/);
  await expect(link).toHaveText(href!);

  // Open.
  await row.getByRole("button", { name: `Abrir mesa ${tableNumber}` }).click();
  await expect(row.getByText("Abierta")).toBeVisible();
  await expect(row.getByRole("button", { name: `Cerrar mesa ${tableNumber}` })).toBeVisible();

  // Close.
  await row.getByRole("button", { name: `Cerrar mesa ${tableNumber}` }).click();
  await expect(row.getByText("Cerrada")).toBeVisible();
  await expect(row.getByRole("button", { name: `Abrir mesa ${tableNumber}` })).toBeVisible();

  // Duplicate number.
  await page.getByLabel("Número de mesa").fill(String(tableNumber));
  await page.getByRole("button", { name: "Crear mesa" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Ya existe una mesa con ese número" })).toBeVisible();
});
