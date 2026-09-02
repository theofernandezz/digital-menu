import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    // Node by default — most tests are domain/application/adapters, no DOM.
    // Component tests opt into jsdom per-file (`// @vitest-environment jsdom`).
    environment: "node",
    globals: true,
    setupFiles: ["./__tests__/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/*.integration.test.ts"],
  },
});
