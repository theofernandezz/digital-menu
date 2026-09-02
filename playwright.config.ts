import { defineConfig, devices } from "@playwright/test";

// Playwright runs from the host — .env.local isn't auto-loaded the way
// Docker Compose's env_file injects it into the container. Node's built-in
// loader (20.6+) reads it into process.env for the spec files to use.
process.loadEnvFile(".env.local");

// Runs from the HOST, not inside the app's Docker container — needs a real
// browser (glibc), the container is musl/Alpine. Assumes `docker compose up`
// is already running; no webServer auto-start, matching how every other
// verification in this project already works (see docs/docker-notes.md).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // shares one real admin account/session, like the integration tests
  // Retry only in CI — 2/4 real runs hit `next dev`/Turbopack failing to
  // resolve `tailwindcss` on the FIRST hot-compile of a route under CI's
  // resource pressure (a route already compiled once, e.g. `/`, was fine
  // seconds earlier in the same run). Environmental flakiness in the dev
  // compiler, not a product bug — Playwright's own standard mitigation for
  // this class of problem, not a mask for a real per-test issue.
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
