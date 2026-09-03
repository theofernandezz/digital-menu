# Skills Improvement Log

> Este archivo captura mejoras sugeridas para los skills. Revisalo periódicamente para actualizar la librería.

---

<!-- 
Formato para agregar mejoras:

## [Fecha] - [Nombre del Skill]

### Contexto
¿Qué tarea estabas haciendo?

### Gap Identificado
¿Qué faltaba o no estaba claro?

### Sugerencia
```typescript
// Código o patrón sugerido
```

### Prioridad
- [ ] Crítico - Se necesita frecuentemente
- [ ] Alto - Ahorraría tiempo
- [ ] Bajo - Nice to have
-->

---

## 2026-03-17 - testing

### Contexto
Revisión y actualización del skill de testing. Al hacer WebFetch de la doc oficial de Vitest se descubrió que el skill estaba desactualizado.

### Gap Identificado
El skill decía "Compatible with Vitest 2.x" pero Vitest estaba en v4.1.0. Tres breaking changes no documentados:
- `maxThreads`/`maxForks` → `maxWorkers`
- `coverage.all` eliminado → `coverage.include` es obligatorio
- `vi.restoreAllMocks()` ya no resetea automocks en v4 — hay que usar también `vi.resetAllMocks()`

### Sugerencia (ya aplicada)
```typescript
// v4: usar ambos en afterEach
afterEach(() => {
  vi.resetAllMocks()    // automocks (vi.mock)
  vi.restoreAllMocks()  // manual spies (vi.spyOn)
})
```

### Prioridad
- [x] Crítico — un bug silencioso que puede hacer pasar tests que deberían fallar

---

## 2026-03-17 - library-architecture

### Contexto
Evaluación general de la librería. Se identificó que `.opencode/` y `skills/generic/` tenían que actualizarse manualmente en paralelo cada vez que se modificaba un skill.

### Gap Identificado
`sync-opencode.sh` existía pero no se corría automáticamente. Cualquier cambio en `skills/` requería acordarse de correr el script manualmente, generando drift silencioso entre las dos copias.

### Sugerencia (ya aplicada)
Pre-commit hook en `.githooks/pre-commit` que corre `sync-opencode.sh` automáticamente antes de cada commit. Activado con `git config core.hooksPath .githooks`.

### Prioridad
- [x] Crítico — el drift entre skills/ y .opencode/skills/ es un bug que se acumula silenciosamente

---

## 2026-03-17 - deploy

### Contexto
Revisión del flujo de instalación de la librería en proyectos externos via `deploy.sh`.

### Gap Identificado
Tres problemas:
1. `deploy.sh` copiaba el `CLAUDE.md` de la librería directamente al proyecto, sin espacio para contexto específico del proyecto.
2. No había forma de saber qué versión de la librería tenía un proyecto deployado.
3. La diferencia entre `setup.sh` (symlinks) y `deploy.sh` (copy) no estaba documentada — filosofías opuestas sin decisión clara.

### Sugerencia (ya aplicada)
- `deploy.sh` genera un `CLAUDE.md` con dos zonas: sección de contexto del proyecto (para que el dev complete) + contenido de la librería.
- `deploy.sh` escribe `.ai-library-version` con fecha y commit del deploy.
- `setup.sh` documentado con comentario claro de cuándo usarlo vs `deploy.sh`.

### Prioridad
- [x] Alto — afecta directamente la experiencia de onboarding en proyectos nuevos

---

## 2026-03-17 - subagents

### Contexto
Investigación sobre si los `agents/*.md` de la librería podían ser subagentes reales de Claude Code.

### Gap Identificado
Los `agents/*.md` eran archivos de contexto (role-playing), no subagentes reales. Claude Code tiene un sistema nativo de subagentes en `.claude/agents/` con delegación automática, aislamiento de contexto, y el campo `skills:` que inyecta skills al arrancar.

VS Code Copilot también lee `.claude/agents/` — un archivo, dos herramientas.
Google Antigravity (v1.20.3+) lee `AGENTS.md` y `SKILL.md` — ya estaba soportado.

### Sugerencia (ya aplicada)
Crear `.claude/agents/` con subagentes nativos (testing, ui, backend, auth) con frontmatter correcto. Actualizar `deploy.sh` para copiar `.claude/agents/` y `skills/generic/` → `.claude/skills/` en el proyecto destino.

### Prioridad
- [x] Alto — es la diferencia entre "Claude actúa como" y "Claude delega a un proceso real"

---

## 2026-03-17 - env-config ✅ aplicado

### Contexto
Revisión de skills faltantes en la librería.

### Gap Identificado
No hay skill para gestión de variables de entorno. Es un patrón transversal que todo proyecto necesita: validar que las env vars existen al startup antes de que la app falle en runtime con un error críptico.

### Sugerencia
```typescript
// lib/env.ts — validación con Zod al startup
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // ...
})

export const env = envSchema.parse(process.env)
// Si falta alguna variable, falla en build time con un error claro
```

### Prioridad
- [ ] Alto — ahorraría tiempo de debugging en cada proyecto nuevo

---

## 2026-03-17 - feedback-loop + governance ✅ aplicado

### Contexto
Discusión sobre cómo hacer que la librería mejore sola detectando gaps en runtime, no solo en revisiones programadas.

### Gap Identificado
El sistema de governance existente detecta si una skill está *stale* (freshness checks + golden prompts) pero no capturaba señales de *uso real*: cuando Claude necesita un patrón que no existe, cuando una skill da guidance incorrecto, o cuando dos skills se contradicen. Sin este mecanismo, los gaps solo se descubren si el usuario los reporta manualmente.

### Sugerencia (ya aplicada)
1. **Self-Improvement Signals** en `CLAUDE.md` — tabla de 5 tipos de señal (`SIGNAL:gap`, `SIGNAL:missing`, `SIGNAL:stale`, `SIGNAL:conflict`, `SIGNAL:unclear`) con instrucción explícita de escribirlas mid-task inmediatamente.
2. **feedback-loop v2.0** — skill actualizado con taxonomía de señales, ejemplos concretos, y protocolo post-tarea simplificado a 4 preguntas.
3. **skill-release-registry.json** — agregados `env-config`, `project-setup`, `feedback-loop` actualizado; `testing` actualizado a `lastVerified: 2026-03-17` con `fileAssertions` para Vitest 4.x.

### Prioridad
- [x] Alto — cierra el loop entre "skill escrita" y "skill que mejora con uso real"

---

---

## 2026-03-23 — SIGNAL:stale — nextjs-core

**Trigger:** User reported server actions patterns were outdated after a Next.js release.
**Gap:** Two breaking changes not reflected in the skill:
1. `useFormState` (react-dom) was removed in React 19 — replaced by `useActionState` from `react`, which returns `[state, formAction, isPending]` (isPending is now built-in, no need for a separate `useFormStatus` for the top-level button).
2. `params` in pages/layouts is now a `Promise<{ id: string }>` in Next.js 15+ — must be `await`-ed before use.
Both the SKILL.md, golden-prompts.json, and prompt-suite-registry.json were asserting the old `useFormState` API, meaning they would falsely *pass* code using the removed hook.
**Suggested fix (applied):** Updated all four files; added `fileAssertions` and `sources` to the registry entry so next staleness is caught automatically within 14 days.
**Priority:** Critical

---

## 2026-03-23 — SIGNAL:gap — skill-creator

**Trigger:** User implemented server actions and was not notified about Next.js 16.2 changes (useActionState, strictRouteTypes, async params) because the skill had no mechanism to surface version-specific changes proactively.
**Gap:** The skill-creator template has no `## 🆕 What's New` section. Skills only contain static patterns — there's nowhere to record "changed in version X" entries that Claude can surface mid-task. Freshness checks catch *stale* skills but don't help Claude proactively tell the developer what changed.
**Suggested fix:** Add a `## 🆕 What's New` section to the skill-creator template, placed right after the core principle. Format: a table with columns `Version | Change | Affects`. Add an explicit instruction line telling Claude to check the table and mention applicable entries before writing code. Applied to `nextjs-core` as reference.
**Priority:** High

*Última revisión: 2026-03-23*

---

## 2026-03-31 — SIGNAL:stale — security

**Trigger:** Routine staleness verification of `skills/generic/security/SKILL.md` (18 days since last verified, cadence is 14 days).
**Gap:** Four stale patterns found:
1. `X-XSS-Protection: 1; mode=block` was still recommended. OWASP Secure Headers Project 2025 explicitly recommends **not** setting this header — it can introduce XSS vulnerabilities in browsers older than Chrome 78 / IE 11.
2. CSP still included `unsafe-eval` and `unsafe-inline` without nonce guidance. OWASP 2025 flags both as defeating CSP's XSS protection.
3. The in-memory `Map` rate limiter had no serverless/edge warning — resets on cold start, not shared across instances.
4. The CSRF helper was missing the Next.js 15+ note that `headers()` must be `await`-ed.
**Suggested fix (applied):** Removed `X-XSS-Protection`; added nonce-based CSP Option A + fallback Option B; added serverless warning to rate limiter with Upstash/Redis example; added explicit Next.js 15+ note to CSRF helper; added `What's New` table; bumped to v2.1.
**Priority:** High

---

## 2026-03-31 — SIGNAL:stale — prisma

**Trigger:** Routine staleness verification of `skills/generic/prisma/SKILL.md` (17 days since last verified, cadence is 14 days).
**Gap:** The schema generator block in the skill had `previewFeatures = ["driverAdapters"]`. In Prisma 6, `driverAdapters` was promoted to GA — including it in `previewFeatures` now causes a deprecation warning and will become an error in future minor versions. Projects following the skill would generate noisy warnings in every `prisma generate` run.
**Suggested fix (applied):** Removed `previewFeatures = ["driverAdapters"]` from the schema example. Added a `driverAdapters is GA` entry to the `## 🆕 What's New` table with a clear note. Updated `lastVerified` to 2026-03-31 and added `fileAssertions` + `sources` to the registry entry for automatic future detection.
**Priority:** High

---

## 2026-08-06 — SIGNAL:gap — skill-sync

**Trigger:** Documenting 4 previously-undocumented Claude Code subagents (`data`, `feature`, `git`, `mobile` in `.claude/agents/`) that existed and worked but had no `agents/*.md`, `CLAUDE.md`, or `AGENTS.md` entry.
**Gap:** Two separate issues found in `skills/skill-sync/assets/sync.sh`:
1. `update_agents_file()` hardcodes scope→file mapping to only `root/ui/backend/auth/testing` (a `case` statement that errors on any other scope) — it cannot support new domains like `data` or `mobile` without editing the script itself.
2. Even for supported scopes, the function doesn't write to the real `AGENTS.md` files — it only writes a preview to `/tmp/skill-sync-preview-$scope.md` (see the "In a real implementation, this would update the file" comment). The Auto-invoke tables actually committed in `AGENTS.md`/`CLAUDE.md` are maintained by hand, not by this script.
**Suggested fix:** Either (a) finish the stubbed write logic and generalize the scope→file case statement to read from a config instead of hardcoding it, or (b) if hand-maintenance is intentional, update `skill-sync/SKILL.md` to say so explicitly instead of implying automation that doesn't happen. Also decide whether `data`/`feature`/`git`/`mobile` warrant their own `/<domain>/AGENTS.md` scoped docs (parity with ui/backend/auth/testing) or whether that four-domain split is deliberate and the rest should stay agents/*.md-only.
**Priority:** Low — didn't block the task (added the 4 agents by hand, same as everything else in this file today), but the script's actual behavior no longer matches what `skill-sync/SKILL.md` claims it does.

---

## 2026-08-06 — SIGNAL:stale — agents/backend.md

**Trigger:** Reading `agents/backend.md` as a style reference while writing `agents/data.md`, `agents/feature.md`, `agents/git.md`, `agents/mobile.md`.
**Gap:** The "Workflow" section's last step says `5. Conectar a componente (useFormState)`. `useFormState` was removed in React 19 in favor of `useActionState` — this was already fixed in `nextjs-core`, `react-patterns`, and the root `changelog.md`, but `agents/backend.md` (and possibly `agents/ui.md`) still reference the old hook name.
**Suggested fix (applied):** Replaced `useFormState` with `useActionState` in `agents/backend.md`'s Workflow section. Audited `agents/ui.md`, `agents/auth.md`, `agents/testing.md`, `agents/data.md`, `agents/feature.md`, `agents/git.md`, `agents/mobile.md` (and their `.claude/agents/` counterparts) — no other stale references found.
**Priority:** High — this is the same breaking change already flagged Critical for `nextjs-core` on 2026-03-23; it just wasn't propagated to the `agents/*.md` docs at the time.

---

## 2026-08-06 — SIGNAL:gap — all generic skills (`metadata.patterns`)

**Trigger:** Auditing skill descriptions for quality/optimization (requested review of all 24 skills).
**Gap:** Every generic `SKILL.md` had a `metadata.patterns` field (file globs like `app/**/*.tsx`) that implied file-based auto-triggering. Grepped `skill-sync/assets/sync.sh`, `sync-opencode.sh`, and `skills/governance/*.mjs` — none of them read `patterns` anywhere. Only `metadata.auto_invoke` is actually parsed (by `skill-sync/assets/sync.sh`'s `extract_metadata()`). The field was pure documentation that looked like automation.
**Suggested fix (applied):** Removed `metadata.patterns` from all 20 generic `SKILL.md` files and from `skill-creator`'s template + worked example, so new skills don't keep copying dead weight. Routing in practice happens via `CLAUDE.md`'s "Automatic Skill Detection" table and `skills/_index.md`, not file globs.
**Priority:** Low — cosmetic/documentation cleanup, no behavior changed since the field was never read.

---

## 2026-09-01 — SIGNAL:missing — new-skill (docker/containerization)

**Trigger:** Implementing build-plan item 1 (Docker local dev setup) — needed a `Dockerfile`, `docker-compose.yml`, and `.dockerignore` for a Next.js app connecting to a remote Supabase instance.
**Gap:** No skill in `skills/generic/` covers Docker, docker-compose, or containerization (verified by grep across `skills/`, `agents/`, and all `AGENTS.md` files — zero hits). `skills/_index.md`'s 25-skill list has no infra/devops entry. Had to derive layer-caching order, the bind-mount-vs-named-volume pattern for `node_modules`, base-image/LTS tradeoffs, and Next 16/Turbopack-specific file-watching behavior (`watchOptions.pollIntervalMs`, not the webpack-era `WATCHPACK_POLLING`) from first principles + framework source instead of a documented pattern.
**Suggested fix:** Add a `docker` (or `containerization`) generic skill covering: dev vs. prod multi-stage Dockerfile patterns for Next.js, the `node_modules` bind-mount-shadowing gotcha and its named-volume fix, pnpm + corepack setup in a container, and Next.js/Turbopack-specific dev-server watch options for bind mounts (macOS FSEvents propagation vs. `pollIntervalMs` polling fallback).
**Priority:** High — this is one of the project's stated interview-skill gaps (CLAUDE.md), so it will recur.

---

## 2026-09-02 — SIGNAL:conflict — database vs. env-config

**Trigger:** Resolving `docs/architecture.md`'s Supabase-client boundary for build-plan step 3 (admin CRUD + auth).
**Gap:** `skills/generic/database/SKILL.md` (lines ~224-263) defines `lib/supabase/server.ts`/`client.ts` using `process.env.NEXT_PUBLIC_SUPABASE_URL!` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!` — the exact raw-`process.env` + non-null-assertion pattern `skills/generic/env-config/SKILL.md` marks FORBIDDEN.
**Suggested fix:** Update `database`'s Supabase client examples to read through `env.ts` (`import { env } from '@/lib/env'`) instead of `process.env!`, matching `env-config`. For this project specifically, `env-config` is authoritative — documented in `docs/architecture.md`.
**Priority:** High — every Supabase client this project writes touches this pattern, starting with step 3's first file.

---

## 2026-09-02 — SIGNAL:conflict — nextjs-core vs. error-handling vs. database (Server Action return shape)

**Trigger:** Deciding the Server Action / use-case boundary for step 3 slice 1 (auth + categories).
**Gap:** Three mutually incompatible Server Action shapes are each presented as "the" pattern: `nextjs-core/SKILL.md:191-253` mandates `(prevState, formData) => Promise<XState>` with `{ errors?, success? }`, matching `useActionState`. `error-handling/SKILL.md:173-230` mandates `(formData) => Promise<ActionResult<T>>` — no `prevState`, so it is NOT `useActionState`-compatible — with a discriminated `{ success: true, data } | { success: false, error }`. `database/SKILL.md:412-465` follows `nextjs-core`'s prevState shape but also mixes in `error-handling`'s error codes. None cross-reference each other.
**Suggested fix:** Pick one canonical shape and make the other two skills defer to it, or document when each applies (e.g. `useActionState`-driven forms vs. fire-and-forget actions). For this project: `docs/crud-auth.md`'s `authedAction(schema, handler)` wrapper returning `{ success, error } | { success, data }` is the decision — to be finalized when the first Server Action (`signIn`) is actually written in the next slice.
**Priority:** High — every mutating Server Action in this project hits this choice.

---

## 2026-09-02 — SIGNAL:gap — nextjs-core / database / agents/auth.md (updateSession never implemented)

**Trigger:** Writing `adapters/driven/supabase/middleware-client.ts` for step 3 slice 1.
**Gap:** `updateSession(request)` is imported in the mandated `middleware.ts` snippets in `nextjs-core/SKILL.md:518-540`, `database/SKILL.md` (file-structure block), and both `agents/auth.md`/`auth/AGENTS.md`, but its implementation is never shown anywhere in the library. Had to write it from the `@supabase/ssr` docs directly (cookie-forwarding pattern in a Next.js middleware, `getUser()` for the refresh side-effect, redirect on missing user).
**Suggested fix:** Add the actual `updateSession()` implementation to `database/SKILL.md` (or a new file in its snippet set) alongside the client/server client examples it already gives.
**Priority:** High — this is required for any Supabase-authenticated app using this library, not project-specific.

---

## 2026-09-02 — SIGNAL:stale — database (redirect() inside try/catch)

**Trigger:** Comparing `database/SKILL.md`'s Server Action example against the auth-check ordering used in step 3 slice 1.
**Gap:** `database/SKILL.md:412-465`'s mandated `createProject` Server Action calls `redirect(...)` **inside** the `try` block, then has `catch (error) { ...; throw error }`. `redirect()` works by throwing a `NEXT_REDIRECT` error internally — that throw is caught by this same `catch`, matches none of the `instanceof` checks, and gets re-thrown by the final `throw error`. It happens to work today only because re-throwing preserves the special error Next.js looks for, but it's fragile: any future change to the catch block risks swallowing the redirect.
**Suggested fix:** Move `redirect()` after the try/catch, or explicitly re-check `isRedirectError(error)` first and re-throw before the `instanceof AppError`/generic branches.
**Priority:** Low — works today by accident, but easy to break silently.

---

## 2026-09-02 — SIGNAL:conflict — hexagonal-architecture skill vs. docs/architecture.md

**Trigger:** Confirming the folder layout for step 3 before writing any files.
**Gap:** `skills/generic/hexagonal-architecture/SKILL.md` prescribes `lib/core/`, `lib/adapters/`, a single `composition.ts` file, "No DI container" (line 65), and ESLint `eslint-plugin-boundaries` enforcement (241-280, not installed). `docs/architecture.md` — authoritative for this project per `CLAUDE.md:24` — uses root-level `domain/`, `application/`, `adapters/`, `composition/container.ts`, and enforces the boundary via a literal grep, not a lint plugin. The two layouts don't compose; following the skill's paths would silently diverge from the project's own doc.
**Suggested fix:** Either make `hexagonal-architecture/SKILL.md` support a root-level layout as a documented variant, or have `docs/architecture.md` explicitly say "supersedes `skills/generic/hexagonal-architecture` for folder paths" so a session that loads the skill first doesn't start writing to `lib/core/`.
**Priority:** Medium — caught before any code was written this time; would silently produce two incompatible trees otherwise.

---

## 2026-09-02 — SIGNAL:gap — nextjs-core (middleware.ts deprecated in Next 16.3.3, no skill mentions it)

**Trigger:** `docker compose logs` after adding `middleware.ts` for step 3 slice 1 showed: `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.`
**Gap:** `nextjs-core/SKILL.md` is written against Next 16.2.1 and gives `middleware.ts` as the canonical pattern (lines 518-540) with no mention of this deprecation. Next 16.3.3 (this project's installed version) already warns on boot and offers `npx @next/codemod@canary middleware-to-proxy`. The file still works today (verified: `/admin/categories` correctly redirects to `/login`), but a future Next release will presumably remove the convention entirely.
**Suggested fix:** Update `nextjs-core/SKILL.md`'s middleware section to use `proxy.ts`, noting `middleware.ts` as the deprecated-but-still-working legacy name, or add a changelog entry so projects on newer Next versions get flagged.
**Priority:** Medium — not breaking yet, but every project using this skill's middleware pattern will hit the same warning and eventually a hard break.

---

## 2026-09-02 — SIGNAL:conflict — ux vs. this project's file layout (admin dashboard)

**Trigger:** Building the categories/items/settings admin CRUD screens (build-plan step 3 UI).
**Gap:** `ux/SKILL.md`'s "File Structure" section (lines ~217-241) prescribes `components/dashboard/*.tsx` for list/toolbar/form-panel/delete-dialog components and `lib/actions/*.ts` for the Server Actions. This project's actual conventions (both `docs/architecture.md` and `docs/crud-auth.md`'s explicit scope cut) put admin CRUD components colocated under `app/admin/<entity>/*.tsx` next to their `actions.ts` — no `components/dashboard/` tree, no `lib/actions/`. Atomic Design (`components/atoms/…`) is reserved for pieces reused across admin and the public menu (Button, Input, Label, …), not a home for one-screen dashboard composites. Following `ux`'s file structure literally would have produced a fourth, unused component tree alongside `atoms/` and the colocated `app/admin/` files.
**Suggested fix:** Make `ux/SKILL.md`'s File Structure section explicitly a "suggested default, not mandatory" and add a note for projects using a hexagonal/Atomic-Design layout: colocate dashboard composites next to their route (`app/**/<entity>/*.tsx`) instead of a parallel `components/dashboard/` tree, and put Server Actions in the same route folder (`actions.ts`) rather than a separate `lib/actions/` — matching what `nextjs-core`/`hexagonal-architecture` already say about colocation.
**Priority:** Medium — caught before any file was misplaced this time, but every project combining `ux` with a colocated-actions convention will hit the same fork.

---

## 2026-09-02 — SIGNAL:conflict — ui-engineering (shadcn under components/ui/) vs. an Atomic Design tree

**Trigger:** Adding Radix Dialog for the delete/edit confirmation modals in the admin CRUD screens.
**Gap:** `ui-engineering/SKILL.md`'s "Component Libraries" section (lines ~262-347) treats `components/ui/` (shadcn's default output folder) as if it were the project's only component tier, with no mention of how it should relate to an Atomic Design tree (`atoms/molecules/organisms/templates`) when both are in use, as this project's `CLAUDE.md` mandates. Without a stated rule, `components/ui/` risks becoming an unofficial fifth layer that pages import from directly, alongside — and inconsistent with — `components/atoms/`.
**Suggested fix:** Add a short note to `ui-engineering/SKILL.md`: when a project also uses Atomic Design, treat `components/ui/` as vendored third-party primitives (not a tier of the design system) — reusable pieces get wrapped or re-exported through `atoms/` (or composed directly, if the composing component is itself the page-level composition point, e.g. a colocated dialog), but `ui/` is never itself "the atoms folder." Prevents two parallel, competing component hierarchies.
**Priority:** Low — resolved by convention on this project without much friction, but worth documenting so the next project combining shadcn + Atomic Design doesn't have to re-derive the same rule.

---

## 2026-09-03 — SIGNAL:missing — new-skill (ci-cd / GitHub Actions)

**Trigger:** Debugging two real CI-only failures in `.github/workflows/ci.yml` (build-plan step 6) a day after the pipeline first went green — a red run with two unrelated causes tangled together.
**Gap:** No skill in `skills/generic/` covers GitHub Actions / CI pipeline design (same absence pattern as the `docker` gap logged 2026-09-01 — `git-workflow` covers commits/branching, not workflow YAML). Two concrete patterns had to be derived from scratch instead of a documented checklist:
1. **No `concurrency` guard, tests hit a shared live external service.** Any workflow whose tests sign in against a real third-party service (Supabase, a staging DB, a payment sandbox, ...) as a fixed account needs a `concurrency: { group: ci-${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true }` block from the start — without it, two pushes seconds apart run two full jobs in parallel against the same account and their fixtures race each other. `fileParallelism: false` / `fullyParallel: false` inside the test runner (already correctly used here) only prevents races *within* one job; it does nothing across two overlapping jobs. This is a one-time, easy-to-forget setup step, not something that shows up until someone pushes twice quickly during debugging.
2. **A flaky CI-only error was assumed to be a timing race and band-aided (prewarm + retries) before checking whether it was a known upstream bug.** `next dev`/Turbopack intermittently failed to resolve `tailwindcss` under GitHub Actions' constrained runner resources. The first fix attempt (retries, a prewarm curl) treated it as "loses a compile race once, retry wins it" — plausible-sounding but wrong, and a WebSearch immediately surfaced [next.js discussion #84495](https://github.com/vercel/next.js/discussions/84495): a known, unresolved Turbopack bug (its CSS pipeline evaluates PostCSS in a child process whose IPC times out under resource pressure), with the community's own workaround being to disable Turbopack in CI. The actual fix (`docker-compose.ci.yml` overriding the app's dev command to `--webpack`) took less effort than the band-aids it replaced, once the real cause was known.
**Suggested fix:** Add a `ci-cd` generic skill covering GitHub Actions workflow design for apps with a real backing service: the `concurrency` group pattern above (with the "why" — shared external state, not just wasted runner minutes), a rule to WebSearch/check the framework's issue tracker for an exact error string before adding a retry/timing band-aid to CI-only flakiness, and the general "reproduce via job logs + timestamps first, band-aid last" debugging order. Could fold into the still-missing `docker` skill from 2026-09-01 (this project's CI runs `docker compose` directly) or stand alone.
**Priority:** High — this project's CI/CD is a stated interview-skill gap (`CLAUDE.md`), and both patterns (concurrency guard for shared external state, check-known-issues-before-band-aiding) generalize to any project with real CI against a real backing service.
