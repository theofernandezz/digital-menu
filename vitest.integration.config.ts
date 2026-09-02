import { defineConfig } from "vitest/config";

// Separate config, not a CLI include/exclude flag on the main one — real
// network calls against the live Supabase project, no jsdom/Testing Library
// setup needed here.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.integration.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**"],
    // All these files sign in as the SAME single admin account against the
    // real project — running them in parallel (Vitest's default) caused
    // concurrent signInWithPassword calls to race, leaving some clients with
    // a session that then failed getUser(). One admin account, one at a time.
    fileParallelism: false,
  },
});
