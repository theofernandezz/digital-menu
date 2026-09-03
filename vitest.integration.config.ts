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
    // Default 10000ms hookTimeout was enough locally but not on a
    // slower-to-Supabase CI runner — published-menu.integration.test.ts's
    // beforeAll does ~10 sequential real round-trips (2 categories, 3 items,
    // a tag sync) to build its fixture. Not parallelized: several of those
    // calls share a per-scope `nextDisplayOrder` counter (e.g. two menu
    // items in the same category both read "0 existing" and race to the
    // same displayOrder if run concurrently) — the exact ordering these
    // tests assert on. A slower, correct sequential setup beats a faster
    // one with a chance of flaking on the very thing being tested.
    hookTimeout: 30000,
    // Same reason as hookTimeout above: individual real round-trips (not
    // just beforeAll setup) can also exceed Vitest's 5000ms default under a
    // CI runner slower to reach Supabase than local Docker Desktop — seen
    // directly: "lists the created item" (a single real network call) timed
    // out post-merge on main even though it passed locally and on the PR's
    // own CI run moments earlier.
    testTimeout: 15000,
  },
});
