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
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
