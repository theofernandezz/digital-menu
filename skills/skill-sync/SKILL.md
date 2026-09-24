---
name: skill-sync
description: |
  Checks that every skill in skills/generic/ is registered where agents and people look for it.
  Trigger: When creating or modifying a skill, or when a skill is missing from an index.
license: MIT
metadata:
  author: ai-library
  version: "2.0"
  scope: [root]
  auto_invoke:
    - "After creating/modifying a skill"
    - "Verify skill registration"
    - "Troubleshoot why a skill is missing from AGENTS.md"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Skill Sync

> **Purpose:** A new skill has to be listed by hand in several files. This check fails when one is forgotten.

---

## What It Checks

Every `skills/generic/<name>/SKILL.md` must appear as `` `<name>` `` in each of these files:

| File | Where the skill goes |
|------|----------------------|
| `skills/_index.md` | Skills table |
| `README.md` | Skills table |
| `AGENTS.md` | Skills Index table, plus its Auto-invoke rows |
| `CLAUDE.md` | Automatic Skill Detection table |
| `GEMINI.md` | Automatic Skill Detection table |

---

## Usage

```bash
./skills/skill-sync/assets/sync.sh
```

Exit `0` when everything is registered; exit `1` and one `✗` line per missing place otherwise. Runs on bash 3.2 (the macOS default) and needs only `grep`.

---

## Not Covered

- **It never writes a file.** Registration is manual. An earlier version tried to generate the `AGENTS.md` Auto-invoke tables from `metadata.auto_invoke` and never worked, so it was removed.
- **It only checks that the name appears.** Keeping the Auto-invoke rows in `AGENTS.md` in step with the skill's `metadata.auto_invoke` is manual.
- **Only `skills/generic/`.** Meta skills at the root of `skills/` are not checked.

---

## Checklist After Creating a Skill

- [ ] Added to the five files above
- [ ] Added to the `skills:` frontmatter of the relevant agent in `.claude/agents/`
- [ ] Added a row to `skills/changelog.md`
- [ ] `./skills/skill-sync/assets/sync.sh` exits `0`
