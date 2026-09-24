# 🎯 AI Skills Directory

This directory contains all AI Skills for the Universal AI Development Library.

## What are AI Skills?

Skills are structured instructions that give AI assistants the context they need to write code that follows your project's standards. They include:

- Coding patterns for each component (UI, Backend, Database)
- Testing conventions (Vitest, Testing Library)
- Architecture guidelines (Server Components, Service Layer)
- Framework-specific rules (Next.js 16, React 19, Tailwind 4)

## Available Skills

### Generic Skills (Any Project)

| Skill            | Description                                       |
| ---------------- | ------------------------------------------------- |
| `typescript`     | Const types, flat interfaces, utility types       |
| `react-patterns` | Compound components, hooks, composition           |
| `nextjs-core`    | App Router, Server Actions, streaming             |
| `ui-engineering` | Distinctive UI systems, Tailwind v4, Shadcn       |
| `ux`             | Product UX flows, CRUD patterns, recovery states  |
| `database`       | Supabase, RLS, Zod schemas, service layer         |
| `security`       | XSS/CSRF prevention, input validation, auth       |
| `error-handling` | Custom errors, boundaries, logging, recovery      |
| `testing`        | Vitest, Testing Library, MSW                      |
| `git-workflow`   | Conventional Commits, branching, PRs              |
| `react-native`   | Expo, navigation, native APIs, mobile performance |

### Meta Skills

| Skill           | Description                                   |
| --------------- | --------------------------------------------- |
| `skill-creator` | Create new AI agent skills                    |
| `skill-sync`    | Check every skill is registered               |
| `project-setup` | Document project context in CLAUDE.md         |

## Setup

```bash
# Configure skills for your AI assistant
./setup.sh

# Options:
./setup.sh --claude     # Claude/Anthropic
./setup.sh --codex      # OpenAI Codex
./setup.sh --github     # GitHub Copilot
./setup.sh --gemini     # Google Gemini
./setup.sh --cursor     # Cursor IDE
./setup.sh --all        # All assistants
```

This creates symlinks in the appropriate directories:

- `.claude/skills/`
- `.codex/skills/`
- `.github/skills/`
- `.gemini/skills/`
- `.cursor/skills/`

> **Note**: Restart your AI coding assistant after running setup to load the skills.

## Skill Structure

Each skill follows this structure:

```
skills/
├── generic/
│   └── [skill-name]/
│       ├── SKILL.md           # Main skill instructions
│       └── references/        # Additional docs (optional)
│           └── *.md
├── skill-creator/             # Meta skill for creating skills
├── skill-sync/                # Check skill registration
│   └── assets/
│       └── sync.sh
├── setup.sh                   # Multi-IDE setup script
└── README.md                  # This file
```

## Creating New Skills

1. Read the `skill-creator/SKILL.md` for the template
2. Create a new directory under `generic/` or another category
3. Add your `SKILL.md` with proper metadata:

```yaml
---
name: Your Skill Name
description: |
  What this skill does.
  Trigger: When to invoke this skill.
license: MIT
metadata:
  author: your-name
  version: "1.0"
  scope: [root, ui, backend]
  auto_invoke:
    - "Action that triggers this skill"
---
```

4. Run `./skill-sync/assets/sync.sh` to check the skill is registered everywhere
5. Commit and push

## Registration Check

```bash
# Exit 1 and list what is missing if a skill isn't registered
./skill-sync/assets/sync.sh
```

---

_Last Updated: 2026-01-16_
