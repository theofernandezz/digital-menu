---
name: Feedback Loop - Self-Improvement
description: |
  Meta-skill for continuous improvement of the AI library. Files a GitHub issue on
  theofernandezz/ai-library when skills fail, are missing, or are stale — from wherever
  the session is running, so a signal from a project or session you don't remember still
  reaches you. Falls back to a local skills/improvements.md entry if gh isn't available.
  Trigger: Activated mid-task when hitting a gap, and after completing significant tasks.
license: MIT
metadata:
  author: ai-library
  version: "3.0"
  scope: [root]
  auto_invoke:
    - "After completing a feature"
    - "When a pattern was missing from a skill"
    - "When a skill didn't cover a case"
    - "When a skill referenced an outdated version"
    - "Improving the library"
---

# Feedback Loop - Self-Improvement

> **Core Principle:** The library improves from real usage. File signals immediately when you hit a gap — don't wait until the end of the task, and don't let them die in a project you'll forget you were in.

---

## 🚨 Signal Types (file immediately mid-task)

These are runtime signals for when skills fail during actual work.

| Signal | When to file |
| ------ | ------------- |
| `SIGNAL:gap` | Loaded a skill but it was missing a pattern you needed |
| `SIGNAL:missing` | Needed a skill that doesn't exist in this library |
| `SIGNAL:stale` | Skill referenced an outdated API, version, or deprecated pattern |
| `SIGNAL:conflict` | Two loaded skills gave contradictory guidance |
| `SIGNAL:unclear` | A skill rule was ambiguous and you had to guess the intent |

### How to file one

1. **Check for a duplicate first:**
   ```bash
   gh issue list --repo theofernandezz/ai-library --state open --search "in:title <skill-name>"
   ```
   A match for the same skill and gap → add a comment there instead of opening a new issue:
   ```bash
   gh issue comment <number> --repo theofernandezz/ai-library --body "Hit this again: <one-line context>"
   ```

2. **No match → create one:**
   ```bash
   gh issue create --repo theofernandezz/ai-library \
     --title "[gap] testing: missing pattern for Zustand subscriptions" \
     --body "$(cat <<'EOF'
   **Trigger:** [one sentence: what you were doing when you hit this]
   **Gap:** [what was missing, stale, or unclear]
   **Suggested fix:** [what the skill should say / what new skill is needed]
   **Priority:** Critical | High | Low
   EOF
   )"
   ```
   Title format: `[type] skill-name: short summary` — `skill-name` is `new-skill` for `SIGNAL:missing`. `type` is the signal type without the `SIGNAL:` prefix (`gap`, `missing`, `stale`, `conflict`, `unclear`).

3. **Fallback — if `gh` fails** (no auth, no network, rate-limited): append the same `**Trigger:**/**Gap:**/**Suggested fix:**/**Priority:**` block to `skills/improvements.md` under a `## [Date] — SIGNAL:[type] — [skill-name]` heading, exactly as before. Don't retry and don't block the task on this — the fallback exists so the signal isn't lost, not so filing it becomes a blocker.

### Examples

```
Title: [gap] testing: missing pattern for Zustand subscriptions
Body:
**Trigger:** Writing tests for a Zustand store that uses subscriptions.
**Gap:** No pattern in testing skill for testing stores with external subscriptions.
**Suggested fix:** Add "Testing Zustand stores" section with renderHook + act pattern.
**Priority:** High
```

```
Title: [missing] new-skill: Stripe/payments integration
Body:
**Trigger:** Implementing Stripe webhooks.
**Gap:** No skill for payment integrations. Had to use api-design + security but
missing webhook signature verification pattern.
**Suggested fix:** Create a payments skill covering Stripe webhooks, idempotency,
and signature verification.
**Priority:** High
```

```
Title: [stale] nextjs-core: use cache directive not documented
Body:
**Trigger:** Using the use cache directive in Next.js 15.
**Gap:** Skill still documented unstable_cache as the recommended pattern.
use cache is now stable in 15.3.
**Suggested fix:** Update to the use cache directive, move unstable_cache to FORBIDDEN.
**Priority:** Critical
```

---

## 📝 Post-Task Review (after completing a task)

After completing any significant task, run this 4-question self-check:

```
1. Did I need to improvise a pattern not covered by any loaded skill?
   → If yes: file SIGNAL:gap or SIGNAL:missing

2. Did I encounter an API or pattern the skill described as current but was outdated?
   → If yes: file SIGNAL:stale

3. Did two skills tell me different things for the same situation?
   → If yes: file SIGNAL:conflict

4. Was a skill rule so ambiguous I had to guess?
   → If yes: file SIGNAL:unclear
```

If all four answers are "no", no issue needed.

---

## 📋 Full Improvement Entry Format

For larger improvements discovered during sessions (not just mid-task signals), file it the same way — dedup search, then `gh issue create` — but with the fuller body:

```markdown
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

When you next sit down to improve the library:
1. `gh issue list --repo theofernandezz/ai-library --state open` — review everything filed since last time
2. Merge accepted improvements into the corresponding SKILL.md
3. Close the issue with a pointer to the commit: `gh issue close <number> --repo theofernandezz/ai-library --comment "Merged in <commit-sha>"`
4. Check `skills/improvements.md` too — entries filed via the fallback path (no `gh` at the time) still need to be turned into issues or merged directly
5. Escalate Critical items immediately — don't wait for a full review pass

---

*Skill Version: 3.0.0 | Meta-skill for library evolution via GitHub issues, with local-file fallback*
