---
name: CI/CD - GitHub Actions
description: |
  GitHub Actions workflow design for apps whose tests run against a real backing service: least-privilege
  permissions, a concurrency guard for shared external state, pinned actions, cheap-checks-first ordering,
  and an evidence-first order for debugging CI-only failures.
  Trigger: Activated when creating or editing .github/workflows, setting up CI, or debugging a failing CI run.
license: MIT
metadata:
  author: ai-library
  version: "1.0"
  scope: [root, testing]
  auto_invoke:
    - "Creating GitHub Actions workflows"
    - "Editing .github/workflows"
    - "Setting up CI"
    - "Debugging a failing CI run"
---

# CI/CD - GitHub Actions

> **Core Principle:** CI is a shared, automated environment — safe by default (least privilege, no secret exposure), serialized against shared state, and debugged from evidence, never from a guess.

---

## 🆕 What's New

> **Instruction for Claude:** When this skill is loaded, check this table and mention any entry relevant to what the developer is working on — before writing code.

| Version | Change | Affects |
|---------|--------|---------|
| 1.0 | Initial skill | — |

---

## 🚫 FORBIDDEN PATTERNS

### 1. Never Run Tests Against Shared External State Without a Concurrency Guard

When tests sign in to a real service (Supabase, a staging DB, a payment sandbox) as a fixed account, two pushes seconds apart start two full jobs in parallel against the same account and their fixtures race each other. `fileParallelism: false` / `fullyParallel: false` in the test runner only serializes *within* one job — it does nothing across two overlapping runs. It is a one-time setup that nobody notices until someone pushes twice quickly.

```yaml
# ❌ FORBIDDEN - overlapping runs share one test account
on: [push, pull_request]
jobs:
  test: ...

# ✅ CORRECT - one run per branch/PR; a newer push cancels the older run
on: [push, pull_request]
concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

Include `github.workflow` in the group so other workflows sharing the ref are not cancelled. For **deploy** workflows use `cancel-in-progress: false`: cancelling a deploy halfway leaves a half-released state, so queue instead.

### 2. Never Band-Aid a CI-Only Failure Before Finding Its Cause

A retry or a "prewarm" step that makes the red go away hides the cause, and the flake comes back with a different symptom.

```yaml
# ❌ FORBIDDEN - blind retry: plausible ("lost a timing race once") and unverified
- run: pnpm test:e2e || pnpm test:e2e

# ✅ CORRECT - the cause is known and linked, so the workaround can be removed later
# Turbopack fails to build a Tailwind app only on Actions runners — vercel/next.js discussion #84495.
# Remove once that is fixed upstream.
- run: pnpm build --webpack
```

Debug in this order: (1) read the job logs and step timestamps; (2) search the **exact error string** in the tool's issue tracker and discussions before assuming a timing race; (3) reproduce under the same constraints (runner size, container, env); (4) only then mitigate, with a comment that links the cause and says when to remove it.

### 3. Never Run Untrusted Code With Secrets (pull_request_target)

`pull_request_target` runs with the base repository's secrets and write token. Checking out the PR's code and executing it there lets any fork run arbitrary commands with those credentials. Use `pull_request` for anything that builds or tests contributed code — secrets are not passed to workflows triggered from forks.

```yaml
# ❌ FORBIDDEN - "pwn request": fork code runs with the repo's secrets
on: pull_request_target
steps:
  - uses: actions/checkout@v7
    with:
      ref: ${{ github.event.pull_request.head.sha }}
  - run: pnpm test

# ✅ CORRECT
on: pull_request
```

### 4. Never Leave Default Permissions or Floating Third-Party Actions

```yaml
# ❌ FORBIDDEN - default token scope, mutable tag from a third party
steps:
  - uses: some-org/some-action@main

# ✅ CORRECT - read-only token; third-party action pinned to a full commit SHA
permissions:
  contents: read
steps:
  - uses: some-org/some-action@<40-char-commit-sha> # v1.2.3
```

---

## ✅ REQUIRED PATTERNS

### 1. Baseline Workflow (Next.js + pnpm)

Cheapest checks first, so a lint error fails in seconds instead of after the build. Every job has a `timeout-minutes`.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v7
      # Third-party action: full SHA pinned, tag in the comment. Reads the pnpm version
      # from the "packageManager" field in package.json when `version` is omitted.
      - uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: pnpm   # pnpm must already be installed — hence the step above
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck   # "tsc --noEmit" in package.json scripts
      - run: pnpm test
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}
      - run: pnpm build
```

Pin `actions/*` to a major tag; pin everything else to a full commit SHA. Verify the current major before copying — actions release new majors regularly.

### 2. Secrets and Shared Services

- Set `env:` with secrets on **the step that needs them**, not at workflow or job level — every step (and every third-party action) after it can read job-level env.
- Tests that hit a real service use a **dedicated test account or project**, never production data, and prefix created records with `${{ github.run_id }}` so a re-run or a leftover fixture cannot collide with the next run.
- Never `echo` a secret or print `env` — logs are readable by anyone with repo access.

### 3. Docker in CI

If the pipeline runs the app through `docker compose` (see `docker`), keep CI differences in an override file instead of editing the dev compose file, so a CI-only workaround stays visible and removable:

```yaml
# docker-compose.ci.yml — used as: docker compose -f docker-compose.yml -f docker-compose.ci.yml up
services:
  web:
    command: ["pnpm", "dev", "--webpack"]   # linked, dated workaround — see Forbidden #2
```

---

## 📁 File Structure

```
.github/
├── workflows/
│   ├── ci.yml            # lint → typecheck → test → build, on push and pull_request
│   └── deploy.yml        # separate workflow, cancel-in-progress: false
└── dependabot.yml        # keeps pinned action SHAs and lockfile up to date
```

---

## 📋 Checklist Before Commit

- [ ] `permissions: contents: read` at workflow level; extra scopes only on the job that needs them
- [ ] `concurrency` group set (`cancel-in-progress: false` for deploys)
- [ ] `timeout-minutes` on every job
- [ ] Third-party actions pinned to a full commit SHA; `actions/*` on a current major
- [ ] Secrets scoped to the steps that need them; tests use a dedicated account and per-run data
- [ ] No `pull_request_target` that checks out or runs PR code
- [ ] Every retry or workaround has a comment linking the cause and when to remove it

---

*Skill Version: 1.0.0 | Compatible with GitHub Actions, Node.js 24, pnpm*
