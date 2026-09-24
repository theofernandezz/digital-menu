---
name: Spec-Driven Development
description: |
  Meta-skill for the orchestrator: size the spec to the cost of being wrong. Inline for clear
  reversible work, a mini-spec + incremental loop for reversible-but-uncertain work, a full
  persisted spec for anything costly to revert or split across subagents.
license: MIT
metadata:
  author: ai-library
  version: "1.1"
  scope: [root]
  auto_invoke:
    - "About to delegate a non-trivial or multi-domain task to a subagent"
    - "Task requirements are ambiguous and haven't been pinned down yet"
    - "A full-stack feature spans two or more domain subagents"
    - "Before invoking the verifier agent — it checks diffs against the spec"
---

# Spec-Driven Development

> **Core Principle:** Ambiguity gets guessed — differently by each subagent, and by the model filling gaps. A spec removes the ambiguity that is expensive to get wrong. It must not be bigger than that: a full spec for a task you don't understand yet is guessing written down. Size it to the cost of being wrong.

---

## Choose the mode

| | **Reversible** (UI, features, logic) | **Costly to revert** |
|---|---|---|
| **Clear requirement, one file/domain** | Inline — no spec | Spec-first |
| **Uncertain or exploratory requirement** | **Incremental** | Spec-first — resolve the uncertainty with the user first |
| **2+ subagents with dependencies** | Spec-first | Spec-first |

**Costly to revert:** schema/migrations, auth/RLS, payments, public API contracts, contracts between subagent steps already implemented.

Ambiguity resolves with the user (`AskUserQuestion`) before writing either kind of spec — a vague criterion only moves the guessing downstream.

---

## Incremental (mini-spec)

Build the smallest thing that is usable on its own — a skateboard, not a wheel — then learn, then grow it.

```markdown
Vision: <one line — where this is heading>
Outcome: <one line — what the user can do after this step>
Criteria:
- [ ] <1–3 falsifiable statements>
```

1. Build the smallest usable step against the criteria.
2. Run the gate (tests/build); if a subagent built it, run `verifier`.
3. Revisit the Vision: is this enough, or does it need a bigger vehicle? Update it, then next step.

The mini-spec lives in the prompt/chat. Persist it to `specs/<slug>.md` only when you delegate it to a subagent or `verifier` — same rule as below. If a step touches anything costly to revert, stop and switch to spec-first.

---

## Spec-first

`specs/<slug>.md` at the target project's root, git-tracked. A spec that only exists inside a delegation prompt can't be checked against later or reused for a follow-up fix.

```markdown
# Spec: <short title>

## Outcome
One or two sentences: what the user can do once this ships.

## Scope
Files/areas this touches. Specific enough that "is this in scope" has an obvious answer.

## Out of scope
Explicitly excluded — adjacent work not listed here gets pulled in by accident.

## Constraints
Hard limits: performance, security, format, edge cases. Anything two people (or two
subagents) could reasonably implement differently.

## Acceptance criteria
- [ ] One falsifiable statement per line — a fresh reviewer can mark PASS/FAIL from the diff alone.
```

### Delegating

Pass each subagent only its slice of the spec — never the orchestrator's reasoning about *why*. Sequential steps (`data` → `backend` → `ui`) each get the previous step's concrete output (paths, exported names) added to their slice; the spec fixes intent, not implementation. See `CLAUDE.md`'s "How to delegate".

### Verifying

`verifier` receives the spec (or the relevant slice) plus the diff. It checks each criterion PASS/FAIL; a criterion with no test exercising it is a FAIL. See `.claude/agents/verifier.md`.

### Lifecycle

Keep the spec after the task ships — it's the record of what was agreed, and the starting point for the next change to that feature.

### Worked example

The "Full-stack features" walkthrough in `CLAUDE.md` (export-to-CSV: spec → `backend` → `ui` → `testing` → `verifier`).
