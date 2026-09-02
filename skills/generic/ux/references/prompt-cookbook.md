# UX Prompt Cookbook

Use these prompts as high-signal starting points for UX-heavy tasks.

## 1) CRUD Dashboard Redesign

```text
Redesign the [entity] management dashboard for admin users.

Context:
- Core actions: create, edit, delete [entity]
- Users perform this flow multiple times per day

Requirements:
- Visible primary CTA in page header
- Search/filter/sort toolbar
- Row actions for edit/delete
- Safe delete confirmation
- Empty/loading/error/success states
- Keyboard accessible forms and table interactions

Output format:
1. UX_CRITERIA block
2. UX rationale
3. Implementation plan
4. Code changes
```

## 2) Form UX Hardening

```text
Improve the UX of the [form-name] form.

Focus:
- Validation timing (submit + blur)
- Field-level error clarity
- Submit loading feedback
- Success and failure recovery messaging
- Mobile touch target and keyboard accessibility

Do not redesign unrelated sections.
```

## 3) Empty/Loading/Error State Pass

```text
Audit and implement missing empty/loading/error/success states for [page/feature].

For each state include:
- Message (clear and concise)
- Primary action (if applicable)
- Recovery action for errors
- Visual consistency with current design system
```

## 4) Destructive Action Safety

```text
Harden destructive actions in [feature].

Implement:
- Confirmation dialog
- Explicit consequence copy
- Optional undo where feasible
- Post-action feedback (toast/alert)

Goal: reduce accidental destructive actions.
```

## 5) Dashboard Information Architecture

```text
Refactor [dashboard/page] information hierarchy.

Goal:
- Make high-frequency tasks faster to complete
- Reduce cognitive load in first 10 seconds

Deliver:
- Proposed section order
- Why this order improves task completion
- Updated layout implementation
```
