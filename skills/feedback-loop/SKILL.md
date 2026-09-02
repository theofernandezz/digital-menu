---
name: Feedback Loop - Self-Improvement
description: |
  Meta-skill for continuous improvement of the AI library. Captures learnings after tasks
  and writes structured signals when skills fail, are missing, or are stale.
  Trigger: Activated mid-task when hitting a gap, and after completing significant tasks.
license: MIT
metadata:
  author: ai-library
  version: "2.0"
  scope: [root]
  auto_invoke:
    - "After completing a feature"
    - "When a pattern was missing from a skill"
    - "When a skill didn't cover a case"
    - "When a skill referenced an outdated version"
    - "Improving the library"
---

# Feedback Loop - Self-Improvement

> **Core Principle:** The library improves from real usage. Write signals immediately when you hit a gap — don't wait until the end of the task.

---

## 🚨 Signal Types (write immediately mid-task)

These are runtime signals for when skills fail during actual work. Write them to `skills/improvements.md` **as soon as you notice them**.

| Signal | When to write |
| ------ | ------------- |
| `SIGNAL:gap` | Loaded a skill but it was missing a pattern you needed |
| `SIGNAL:missing` | Needed a skill that doesn't exist in this library |
| `SIGNAL:stale` | Skill referenced an outdated API, version, or deprecated pattern |
| `SIGNAL:conflict` | Two loaded skills gave contradictory guidance |
| `SIGNAL:unclear` | A skill rule was ambiguous and you had to guess the intent |

### Signal Format

```markdown
## [Date] — SIGNAL:[type] — [skill-name or "new-skill"]

**Trigger:** [one sentence: what you were doing when you hit this]
**Gap:** [what was missing, stale, or unclear]
**Suggested fix:** [what the skill should say / what new skill is needed]
**Priority:** Critical | High | Low
```

### Signal Examples

```markdown
## 2026-03-17 — SIGNAL:gap — testing

**Trigger:** Writing tests for a Zustand store that uses subscriptions.
**Gap:** No pattern in testing skill for testing stores with external subscriptions.
**Suggested fix:** Add "Testing Zustand stores" section with `renderHook` + `act` pattern.
**Priority:** High

---

## 2026-03-17 — SIGNAL:missing — new-skill

**Trigger:** Implementing Stripe webhooks.
**Gap:** No skill for payment integrations (Stripe). Had to use api-design + security but missing webhook signature verification pattern.
**Suggested fix:** Create `payments` skill covering Stripe webhooks, idempotency, and signature verification.
**Priority:** High

---

## 2026-03-17 — SIGNAL:stale — nextjs-core

**Trigger:** Using `use cache` directive in Next.js 15.
**Gap:** Skill still documented `unstable_cache` as the recommended pattern. `use cache` is now stable in 15.3.
**Suggested fix:** Update to `use cache` directive, move `unstable_cache` to FORBIDDEN.
**Priority:** Critical
```

---

## 📝 Post-Task Review (after completing a task)

After completing any significant task, run this 4-question self-check:

```
1. Did I need to improvise a pattern not covered by any loaded skill?
   → If yes: write SIGNAL:gap or SIGNAL:missing

2. Did I encounter an API or pattern the skill described as current but was outdated?
   → If yes: write SIGNAL:stale

3. Did two skills tell me different things for the same situation?
   → If yes: write SIGNAL:conflict

4. Was a skill rule so ambiguous I had to guess?
   → If yes: write SIGNAL:unclear
```

If all four answers are "no", no log entry needed.

---

## 📋 Full Improvement Entry Format

For larger improvements discovered during sessions (not just mid-task signals):

```markdown
## [Date] - [Skill Name]

### Context
What task were you doing?

### Gap Identified
What was missing or unclear?

### Suggestion
[Code example or pattern that should be added]

### Priority
- [ ] Critical - Needed frequently, causes bugs if missing
- [ ] High - Would save time
- [ ] Low - Nice to have
```

---

## 📊 Periodic Review (for maintainers)

Monthly, review `skills/improvements.md` and:
1. Merge accepted improvements into the corresponding SKILL.md
2. Update `skill-release-registry.json` → bump `lastVerified`
3. Mark implemented entries as `✅ aplicado`
4. Escalate Critical items immediately — don't wait for monthly review

---

*Skill Version: 2.0.0 | Meta-skill for library evolution via runtime signals*
