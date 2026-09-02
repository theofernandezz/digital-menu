// One full lifecycle through the real running app — auth + CRUD together,
// the two named interview skill gaps at once. Run with:
//   npx playwright install chromium   (one-time, host-side)
//   docker compose up -d              (the app must be running)
//   pnpm test:e2e
import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

test("admin logs in, creates and deletes a category, signs out, and stays signed out", async ({ page }) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "ADMIN_EMAIL / ADMIN_PASSWORD must be set in .env.local");

  // Unauthenticated /admin redirects to /login (middleware).
  await page.goto("/admin/categories");
  await expect(page).toHaveURL(/\/login$/);

  // Real login through the real form.
  await page.getByLabel("Correo electrónico").fill(ADMIN_EMAIL!);
  await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  // Create a category through the real form.
  await page.goto("/admin/categories");
  const categoryName = `E2E Category ${Date.now()}`;
  await page.getByLabel("Nombre").fill(categoryName);
  await page.getByRole("button", { name: "Crear categoría" }).click();
  await expect(page.getByText(categoryName)).toBeVisible();

  // Delete it through the real confirm dialog. Asserting on `row` itself
  // (not a fresh getByText(categoryName)) avoids a strict-mode collision
  // with the confirm dialog's own heading, which also contains the name.
  const row = page.locator("li", { hasText: categoryName });
  await row.getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(row).not.toBeVisible();

  // Sign out — session actually invalidated, not just a client redirect.
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
});
