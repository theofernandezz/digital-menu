---
name: Git Workflow & Conventional Commits
description: |
  Standardized Git workflow with Conventional Commits, branching strategy, and PR practices.
  Trigger: Activated when making commits, creating branches, or discussing Git workflow.
license: MIT
metadata:
  author: ai-library
  version: "2.0"
  scope: [root]
  auto_invoke:
    - "Making commits"
    - "Creating branches"
    - "Creating pull requests"
    - "Git workflow"
---

# Git Workflow & Conventional Commits

> **Core Principle:** Every commit tells a story. The Git history should be readable like a changelog.

---

## 📏 Conventional Commits

All commit messages MUST follow the Conventional Commits specification.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | New feature for the user | `feat(auth): add Google OAuth login` |
| `fix` | Bug fix for the user | `fix(cart): resolve quantity update race condition` |
| `docs` | Documentation only | `docs(readme): add deployment instructions` |
| `style` | Formatting, no code change | `style(button): fix indentation` |
| `refactor` | Code change, no new feature/fix | `refactor(api): extract validation logic` |
| `perf` | Performance improvement | `perf(images): add lazy loading` |
| `test` | Adding/updating tests | `test(auth): add login flow tests` |
| `build` | Build system or dependencies | `build(deps): upgrade next to 15.1` |
| `ci` | CI/CD configuration | `ci(github): add preview deployment` |
| `chore` | Maintenance, no production code | `chore(eslint): update rules` |
| `revert` | Reverting a previous commit | `revert: feat(auth): add Google OAuth` |

### Rules

```bash
# ❌ FORBIDDEN - Vague messages
git commit -m "fix bug"
git commit -m "updates"
git commit -m "WIP"
git commit -m "asdfasdf"

# ❌ FORBIDDEN - Past tense
git commit -m "feat: added new button"
git commit -m "fix: fixed the issue"

# ✅ CORRECT - Imperative mood, present tense
git commit -m "feat(ui): add dark mode toggle"
git commit -m "fix(auth): handle expired token refresh"
git commit -m "refactor(database): simplify query builder"
```

### Scope Guidelines

| Scope | Description |
|-------|-------------|
| `auth` | Authentication & authorization |
| `ui` | UI components and styling |
| `api` | API routes and server actions |
| `db` | Database schemas and queries |
| `config` | Configuration and environment |
| `deps` | Dependencies |
| *feature-name* | Specific feature (e.g., `cart`, `checkout`) |

---

## 🌿 Branching Strategy

### Branch Naming

```bash
# Pattern: <type>/<ticket-id>-<short-description>

# ❌ FORBIDDEN
git checkout -b new-feature
git checkout -b johns-branch
git checkout -b fix

# ✅ CORRECT
git checkout -b feature/AUTH-123-google-oauth
git checkout -b fix/CART-456-quantity-race-condition
git checkout -b refactor/API-789-validation-logic
git checkout -b hotfix/PROD-001-critical-auth-bug
```

### Branch Types

| Prefix | Purpose | Base Branch | Merges Into |
|--------|---------|-------------|-------------|
| `feature/` | New features | `develop` or `main` | `develop` |
| `fix/` | Bug fixes | `develop` | `develop` |
| `hotfix/` | Critical production fixes | `main` | `main` + `develop` |
| `refactor/` | Code refactoring | `develop` | `develop` |
| `docs/` | Documentation updates | `main` | `main` |
| `release/` | Release preparation | `develop` | `main` + `develop` |

### Protected Branches

```yaml
# Branch protection rules
main:
  - Require pull request reviews (1+)
  - Require status checks to pass
  - No direct pushes
  - No force pushes

develop:
  - Require status checks to pass
  - Allow squash merging
```

---

## 🔄 Commit Best Practices

### Atomic Commits

Each commit should be ONE logical change.

```bash
# ❌ FORBIDDEN - Multiple unrelated changes
git add .
git commit -m "feat: add button and fix header and update deps"

# ✅ CORRECT - Separate atomic commits
git add components/ui/button.tsx
git commit -m "feat(ui): add primary button component"

git add components/layout/header.tsx
git commit -m "fix(layout): correct header alignment on mobile"

git add package.json pnpm-lock.yaml
git commit -m "build(deps): upgrade react to 19.1"
```

### Interactive Staging

```bash
# Stage specific hunks for atomic commits
git add -p

# Stage specific files
git add components/ui/button.tsx lib/utils/cn.ts
```

### Commit Frequency

```bash
# Commit often, push when ready
# Good rhythm:
# - Commit after each logical unit of work
# - Push at least once per feature/task completion
# - Never leave uncommitted work overnight
```

---

## 📋 Pull Request Template

```markdown
## Description
<!-- Brief description of changes -->

## Type of Change
- [ ] 🚀 Feature
- [ ] 🐛 Bug fix
- [ ] 📝 Documentation
- [ ] ♻️ Refactor
- [ ] 🎨 Style
- [ ] ⚡ Performance

## Related Issues
<!-- Link to related issues: Fixes #123 -->

## Changes Made
- Change 1
- Change 2

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.logs or debug code
```

---

## 🔀 Merge Strategies

### When to Use Each

| Strategy | When | Command |
|----------|------|---------|
| **Squash** | Feature branches with messy history | PR: "Squash and merge" |
| **Rebase** | Clean up before PR | `git rebase -i main` |
| **Merge** | Preserving feature history | `git merge --no-ff` |

### Pre-Merge Checklist

```bash
# 1. Update from main
git fetch origin main
git rebase origin/main

# 2. Run tests
pnpm test
pnpm typecheck

# 3. Clean up commits (if needed)
git rebase -i HEAD~3

# 4. Push (force if rebased)
git push --force-with-lease
```

---

## 🏷️ Versioning

Follow Semantic Versioning (SemVer):

```
MAJOR.MINOR.PATCH

1.0.0 → 1.0.1  (patch: bug fix)
1.0.1 → 1.1.0  (minor: new feature, backward compatible)
1.1.0 → 2.0.0  (major: breaking change)
```

### Release Workflow

```bash
# Create release branch
git checkout -b release/1.2.0

# Update version
npm version minor

# Merge to main
git checkout main
git merge --no-ff release/1.2.0
git tag v1.2.0

# Merge back to develop
git checkout develop
git merge --no-ff release/1.2.0

# Clean up
git branch -d release/1.2.0
```

---

## 🛡️ Git Hooks (Husky + lint-staged)

```json
// package.json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
pnpm lint-staged

# .husky/commit-msg
pnpm commitlint --edit $1
```

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'build', 'ci', 'chore', 'revert'
    ]],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
  },
}
```

---

## 📋 Git Checklist

- [ ] Commit message follows Conventional Commits
- [ ] Branch name follows naming convention
- [ ] Atomic commits (one logical change per commit)
- [ ] No WIP commits in final PR
- [ ] Tests pass locally before push
- [ ] Rebased on latest main before PR

---

*Skill Version: 2.0.0*
