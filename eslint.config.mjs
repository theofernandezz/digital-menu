import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Hexagonal boundaries (docs/architecture.md, docs/architecture-map.md).
// Dependencies point inward only: components/app -> composition -> application
// -> domain, with adapters plugging in through application's ports. Enforced
// here so it stays true without anyone having to remember it. Tests are exempt
// on purpose: integration tests build real adapters through composition.
const TEST_FILES = ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**"];

const FRAMEWORK = ["next", "next/**", "react", "react/**", "react-dom", "react-dom/**"];
const SUPABASE_SDK = ["@supabase/**"];
const OUTER_LAYERS = ["@/adapters/**", "@/composition/**", "@/app/**", "@/components/**"];

// Boundary patterns match @/-alias imports, so a parent-relative path
// ("../../adapters/x") would slip past them. Cross-folder imports must use the alias.
// A regex on the ".." SEGMENT (not a gitignore-style "../**" group, which misses
// "./../x" and a bare ".."): it matches "../x", "./../x", "a/../b" and "..", but not
// "./sibling" or a package name that merely contains two dots ("some..pkg").
const NO_PARENT_RELATIVE = {
  regex: "(^|/)\\.\\.(/|$)",
  message: "Import across folders with the @/ alias, not a parent-relative path — the layer boundaries can only see aliased imports.",
};

const restrict = (files, patterns, ignores = TEST_FILES) => ({
  files,
  ignores,
  rules: { "@typescript-eslint/no-restricted-imports": ["error", { patterns: [...patterns, NO_PARENT_RELATIVE] }] },
});

const boundaries = [
  restrict(["domain/**"], [
    {
      group: ["@/application/**", "@/lib/**", ...OUTER_LAYERS],
      message: "domain/ is the innermost layer: it depends on nothing else in the app.",
    },
    { group: [...FRAMEWORK, ...SUPABASE_SDK], message: "domain/ must stay framework- and SDK-free." },
  ]),

  restrict(["application/**"], [
    {
      group: ["@/lib/**", ...OUTER_LAYERS],
      message: "application/ depends on domain/ and its own ports only — adapters plug in through ports.",
    },
    { group: [...FRAMEWORK, ...SUPABASE_SDK], message: "application/ must stay framework- and SDK-free." },
  ]),

  restrict(["adapters/**"], [
    {
      group: ["@/app/**", "@/components/**", "@/composition/**", "@/application/use-cases/**"],
      message: "adapters/ implement ports and use domain/ — they never reach into use cases or outer layers.",
    },
  ]),

  // composition/ is the one wiring point: it may know use cases and adapters,
  // but only needs the Supabase client's TYPE (never constructs one).
  restrict(["composition/**"], [
    { group: ["@/app/**", "@/components/**"], message: "composition/ must not depend on the UI or the routing layer." },
    {
      group: SUPABASE_SDK,
      allowTypeImports: true,
      message: "Constructing a Supabase client belongs to adapters/driven/supabase/ — composition/ may only import its type.",
    },
  ]),

  // app/ is the driving adapter.
  restrict(["app/**"], [
    {
      group: ["@/adapters/**", ...SUPABASE_SDK],
      message: "app/ reaches the backend through @/composition/request-scope (use cases), never adapters/ or the Supabase SDK directly.",
    },
    {
      group: ["@/composition/container", "@/composition/catalog", "@/composition/identity"],
      message: "app/ gets use cases from getUseCases() in @/composition/request-scope, not from a module's factories.",
    },
  ]),

  restrict(["components/**"], [
    {
      group: ["@/adapters/**", "@/composition/**", "@/app/**", ...SUPABASE_SDK],
      message: "components/ is presentation-only: no data access, no wiring, no routing layer.",
    },
    {
      group: ["@/application/**", "@/domain/**"],
      allowTypeImports: true,
      message: "components/ may import types from application/ and domain/, never call into them.",
    },
  ]),

  // middleware.ts is the one file outside composition/ allowed to import an
  // adapter (session refresh runs before any route). It still never imports the SDK.
  restrict(["middleware.ts"], [
    { group: SUPABASE_SDK, message: "middleware.ts calls adapters/driven/supabase/middleware-client, never the SDK." },
  ]),
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...boundaries,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
