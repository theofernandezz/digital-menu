# Spec: F1-4a — dining tables are identified by a number, not a label

Mode: spec-first (schema change, and it must be applied to production by hand). F1-4 is split in two: this step (F1-4a, database only) and F1-4b (the `/admin/tables` page, later, built on top of this).

## Outcome
A table is identified by `table_number` (an integer, 1 to 999, unique per restaurant) instead of a free-text `label`. Everything that reads a table's identity reads that one integer; the UI will render it as "Mesa N". Local dev, tests and CI use the new shape, and there is a tested one-paste script to move production to it.

## Scope
- One new migration, `supabase/migrations/20260924000000_dining_tables_number.sql`: replaces `dining_tables.label` (and its `unique (restaurant_id, label)`) by `table_number`; drops and recreates `public.get_table_status(text)` so it returns `(table_number int, is_open boolean)` instead of `(label text, is_open boolean)`; re-applies that function's revokes and grants exactly as the F1-2 migration does.
- `supabase/seed.sql`: the three seeded tables become numbers 1, 2 and 3, keeping the tokens `dev-table-1..3` and their open sessions.
- Integration tests and fixtures that touch `label`, updated one for one: `adapters/driven/supabase/__tests__/get-table-status.integration.test.ts`, `table-access.integration.test.ts`, `support/ordering-fixtures.ts`.
- New tests for the new constraints.
- A production script (see below), written to the scratchpad path the orchestrator gives, never inside the repo.

## Out of scope
- Any TypeScript in `application/`, `adapters/` (non-test), `composition/`, `app/`, `components/`: nothing there reads `label` today.
- The `/admin/tables` page, table use cases, QR image generation, editing or deleting tables (F1-4b and later).
- `docs/`: the orchestrator updates the docs afterwards. Do not edit them.
- Editing any existing migration file. They are already applied to production; this change is a new file.
- Connecting to the hosted project in any way. Do not use production credentials or `.env.prod.local`.

## Constraints
- `table_number int not null check (table_number between 1 and 999)`, `unique (restaurant_id, table_number)`. The same number may exist in two different restaurants.
- The migration must fail loudly if `dining_tables` already has rows (adding a NOT NULL column without a default does that). Production has no tables; do not backfill or guess.
- `get_table_status` keeps everything else from F1-2: `security definer`, empty `search_path` with every object schema-qualified, `stable`, never returns the token, zero rows for an unknown token, `is_open` true only with an open session and a published restaurant. Grants after the change are exactly what they are today: execute for `anon` and `authenticated`, nothing for `PUBLIC`. `db-catalog.integration.test.ts` must keep passing without being weakened.
- RLS policies and table grants on `dining_tables` are unchanged (the migration must not drop or replace them).
- Existing tests: change only what `label` forces (the column name and the values inserted); every assertion keeps its meaning and strength. If an existing test fails for any other reason, stop and report.
- Fixtures must not collide or run out of numbers: the integration suite has to pass when run several times in a row against the same local database (no growth of table numbers across runs beyond 999, no duplicate-number errors between tests).
- Production script: a single transaction that (1) aborts unless this is the right database (`menu_items`, `restaurants`, `dining_tables` exist, `dining_tables.label` exists, `dining_tables.table_number` does not, `get_table_status(text)` exists) and `dining_tables` has zero rows; (2) contains the migration exactly as the repo file; (3) asserts the resulting shape: column type and NOT NULL, the check and unique constraints, the function's return columns, and the function's exact grants (anon and authenticated execute, nothing for PUBLIC), with the same strictness as the earlier script. Model for structure and strictness: `/Users/theofernandez/Desktop/prod-apply-f1.sql` (read only; do not modify it).
- Test the production script only against local Supabase, by simulating production's pre-state (the schema as of the F1-2 migrations, without this migration): it must apply; refuse to run twice; refuse when a row exists in `dining_tables`; and roll back completely when an assertion is made to fail.
- Anything ambiguous and not covered here: stop and report, do not guess.

## Acceptance criteria
- [ ] A new migration file exists at the path above, and `git diff` shows no change to any existing file under `supabase/migrations/`.
- [ ] A fresh `supabase db reset` applies every migration and the seed without error; afterwards `dining_tables` has numbers 1, 2, 3 with tokens `dev-table-1..3`, each with an open session, and no `label` column.
- [ ] A test proves `table_number` 0 and 1000 are rejected, a duplicate number in the same restaurant is rejected, and the same number in a second restaurant is accepted.
- [ ] A test proves `get_table_status` returns exactly the columns `table_number` and `is_open` (never the token) for an open table, a closed table, and an unpublished restaurant, and zero rows for an unknown token; `db-catalog.integration.test.ts` passes unchanged and still proves the function's exact grants.
- [ ] The diff of the pre-existing test files shows only changes forced by the rename (`label` to `table_number`, values inserted); no assertion removed, weakened or skipped.
- [ ] `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` and `pnpm test:integration` pass, and the integration suite passes a second time in a row on the same database.
- [ ] The production script exists at the scratchpad path, and the report lists the four checks run against a simulated production state (applies; refuses a second run; refuses with a row present; rolls back on a forced failed assertion) with their observed outcomes.
