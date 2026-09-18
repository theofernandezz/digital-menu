---
name: Spec-Driven Development
description: |
  Meta-skill for the orchestrator: write a persisted spec before delegating a non-trivial
  task to subagents. The spec — not the conversation, not the orchestrator's reasoning —
  is what subagents implement against and what `verifier` checks diffs against.
license: MIT
metadata:
  author: ai-library
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "About to delegate a non-trivial or multi-domain task to a subagent"
    - "Task requirements are ambiguous and haven't been pinned down yet"
    - "A full-stack feature spans two or more domain subagents"
    - "Before invoking the verifier agent — it checks diffs against the spec"
---

# Spec-Driven Development

> **Core Principle:** A subagent starts with zero context. If what it implements against is the orchestrator's summary of the conversation, every ambiguity the orchestrator resolved in its head gets re-guessed, differently, by each subagent that touches the task. The spec is the fix: one artifact, written once, that every subagent and the verifier read identically.

---

## When to write one

Same bar as the global "Plan First" rule — non-trivial, multi-file, or architectural — with one addition specific to this library: **any task that will be split across two or more subagents**, even a small one, because that's exactly where each subagent's independent guessing diverges.

Skip it for a single-file, single-domain change you're handling inline without delegating.

## Where it lives

`specs/<slug>.md` at the target project's root, git-tracked. Not ephemeral, not just a prompt — a spec that only exists inside a delegation prompt can't be checked against later, and can't be reused when the same feature needs a follow-up fix.

## The template

```markdown
# Spec: <short title>

## Outcome
One or two sentences: what the user can do once this ships.

## Scope
Files/areas this touches. Be specific enough that "is this in scope" has an obvious answer.

## Out of scope
Explicitly excluded. This is what stops scope creep during implementation — if it's not
listed as excluded and it's adjacent to the work, assume it'll get pulled in by accident.

## Constraints
Hard limits: performance, security, format, edge-case behavior. Anything two people
(or two subagents) could reasonably implement differently without this being spelled out.

## Acceptance criteria
- [ ] Checklist, one falsifiable statement per line — not "works well," but something
      a fresh reviewer with no other context can mark PASS/FAIL just by reading the diff.
```

Resolve ambiguity here, with the user if needed (`AskUserQuestion`), before writing a single line of the spec. A spec with a vague acceptance criterion just moves the guessing downstream instead of removing it.

## Using it to delegate

Pass each subagent only the slice of the spec relevant to its domain — not the whole spec verbatim if half of it doesn't apply, and never the orchestrator's own reasoning about *why* the spec says what it says. See `CLAUDE.md`'s "How to delegate" — this skill is what feeds that step's prompt.

Sequential steps (e.g. `data` → `backend` → `ui`) each need the previous step's concrete output (file paths, exported names) added to their slice — the spec fixes intent, not implementation details another subagent produced after it was written.

## Using it to verify

`verifier` receives the spec (or the relevant slice) plus the diff — never the implementer's reasoning. It checks each acceptance criterion individually, PASS/FAIL. A criterion with no test exercising it is a FAIL even if the code looks right. See `.claude/agents/verifier.md`.

## Lifecycle

Keep the spec file after the task ships — it's the historical record of what was actually agreed, useful for the next change to the same feature. Don't delete it once merged; don't treat it as a scratch file.

## Worked example

See the "Full-stack features" walkthrough pattern in `CLAUDE.md` for a complete example (export-to-CSV feature: spec → `backend` → `ui` → `testing` → `verifier`).
