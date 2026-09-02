---
name: skill-sync
description: |
  Syncs skill metadata to AGENTS.md Auto-invoke sections.
  Trigger: When updating skill metadata, regenerating Auto-invoke tables, or running sync.sh.
license: MIT
metadata:
  author: ai-library
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "After creating/modifying a skill"
    - "Regenerate AGENTS.md Auto-invoke tables"
    - "Troubleshoot why a skill is missing from AGENTS.md"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Skill Sync

> **Purpose:** Keeps AGENTS.md Auto-invoke sections in sync with skill metadata. When you create or modify a skill, run the sync script to automatically update all affected AGENTS.md files.

---

## Required Skill Metadata

Each skill that should appear in Auto-invoke sections needs these fields in frontmatter:

```yaml
---
name: skill-name
description: |
  What this skill does.
metadata:
  author: your-name
  version: "1.0"
  scope: [ui, backend]           # Which AGENTS.md files to update
  auto_invoke:
    - "Action that triggers this skill"
    - "Another action"
---
```

### Scope Values

| Scope | Updates |
|-------|---------|
| `root` | `AGENTS.md` (repo root) |
| `ui` | `ui/AGENTS.md` |
| `backend` | `backend/AGENTS.md` |
| `auth` | `auth/AGENTS.md` |
| `testing` | `testing/AGENTS.md` |

Skills can have multiple scopes: `scope: [ui, backend]`

---

## Usage

### After Creating/Modifying a Skill

```bash
./skills/skill-sync/assets/sync.sh
```

### What It Does

1. Reads all `skills/*/SKILL.md` and `skills/generic/*/SKILL.md` files
2. Extracts `metadata.scope` and `metadata.auto_invoke`
3. Generates Auto-invoke tables for each AGENTS.md
4. Updates the `### Auto-invoke Skills` section in each file

---

## Commands

```bash
# Sync all AGENTS.md files
./skills/skill-sync/assets/sync.sh

# Dry run (show what would change)
./skills/skill-sync/assets/sync.sh --dry-run

# Sync specific scope only
./skills/skill-sync/assets/sync.sh --scope ui
```

---

## Example

Given this skill metadata:

```yaml
# skills/generic/ui-engineering/SKILL.md
metadata:
  scope: [ui, root]
  auto_invoke:
    - "Creating/styling components"
    - "Working with Tailwind classes"
```

The sync script generates in `ui/AGENTS.md`:

```markdown
### Auto-invoke Skills

| Action | Skill |
|--------|-------|
| Creating/styling components | `ui-engineering` |
| Working with Tailwind classes | `ui-engineering` |
```

---

## Checklist After Modifying Skills

- [ ] Added `metadata.scope` to new/modified skill
- [ ] Added `metadata.auto_invoke` with action descriptions
- [ ] Ran `./skills/skill-sync/assets/sync.sh`
- [ ] Verified AGENTS.md files updated correctly

---

*Skill Version: 1.0.0 | Auto-sync for AI Skills*
