---
name: UX Design Systems - Product Flows
description: |
  Practical UX rules for product interfaces: flows, information hierarchy, CRUD dashboards,
  forms, error prevention, and recovery states.
  Trigger: Activated when designing or refactoring user flows, dashboards, forms, and interaction models.
license: MIT
metadata:
  author: ai-library
  version: "1.0"
  scope: [root, ui, backend]
  auto_invoke:
    - "Designing user flows"
    - "Improving dashboard UX"
    - "Designing CRUD interfaces"
    - "Defining empty/loading/error states"
    - "Form UX and validation flows"
---

# UX Design Systems - Product Flows

> **Core Principle:** A beautiful UI that is hard to use is still broken. Optimize for user success rate, time-to-completion, and error recovery.

---

## UX Priorities (in order)

1. Clarity: Users understand what to do next.
2. Safety: Destructive actions are hard to trigger by accident.
3. Speed: Frequent actions are fast and low-friction.
4. Recovery: Errors are actionable and reversible.
5. Polish: Visual quality supports trust and comprehension.

---

## 🚫 FORBIDDEN PATTERNS

### 1. Hidden Primary Action

```tsx
// ❌ FORBIDDEN - Primary action buried in menus
<DropdownMenu>
  <DropdownMenuItem>Create Service</DropdownMenuItem>
</DropdownMenu>

// ✅ CORRECT - Primary action always visible in page header
<PageHeader
  title="Services"
  action={<Button>Create Service</Button>}
/>
```

### 2. Destructive Action Without Confirmation

```tsx
// ❌ FORBIDDEN - One-click delete for critical entities
<Button variant="destructive" onClick={deleteService}>Delete</Button>

// ✅ CORRECT - Confirmation with explicit context
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Delete service?</AlertDialogTitle>
    <AlertDialogDescription>
      This action cannot be undone.
    </AlertDialogDescription>
  </AlertDialogContent>
</AlertDialog>
```

### 3. Generic Errors With No Recovery Path

```tsx
// ❌ FORBIDDEN
<Alert>Error occurred</Alert>

// ✅ CORRECT
<Alert variant="destructive">
  <AlertTitle>Could not save service</AlertTitle>
  <AlertDescription>
    Check required fields and try again, or retry in a few seconds.
  </AlertDescription>
</Alert>
```

### 4. Placeholder-Only Inputs

```tsx
// ❌ FORBIDDEN
<Input placeholder="Service name" />

// ✅ CORRECT
<Label htmlFor="service-name">Service name</Label>
<Input id="service-name" placeholder="Premium Support" />
```

---

## ✅ REQUIRED PATTERNS

### 1. CRUD Dashboard UX Blueprint

For list management pages (services, products, users), include:

- Clear page title + one visible primary CTA.
- Search + filter + sort controls above the list.
- Row-level quick actions (edit/delete).
- Safe deletion flow (confirm + feedback).
- Empty/loading/error/success states.

```tsx
<PageHeader
  title="Services"
  description="Create and manage catalog services"
  action={<Button>Create service</Button>}
/>

<Toolbar>
  <SearchInput />
  <FilterSelect />
  <SortSelect />
</Toolbar>

<ServiceTable />
```

### 2. State Quartet Is Mandatory

Every important screen should define:

1. Empty state
2. Loading state
3. Error state
4. Success feedback

```tsx
if (isLoading) return <ServiceTableSkeleton />;
if (error) return <ErrorState retry={refetch} />;
if (services.length === 0) return <EmptyState ctaLabel="Create service" />;

return <ServiceTable services={services} />;
```

### 3. Validation Timing Rules

- Validate required fields on submit.
- Validate format constraints on blur.
- Show field-specific messages near the field.
- Avoid flashing errors before first interaction.

```tsx
<Input aria-invalid={!!errors.price} aria-describedby="price-error" />;
{
  errors.price && (
    <p id="price-error" role="alert" className="text-sm text-destructive">
      {errors.price.message}
    </p>
  );
}
```

### 4. Fast Path + Safe Path

Design both:

- Fast path: common action in minimal steps.
- Safe path: confirmation for risky operations.

Example for services dashboard:

- Fast path: Edit from row action with side panel.
- Safe path: Delete via confirmation dialog.

### 5. UX Acceptance Criteria Block (REQUIRED)

Before implementing UI changes, define:

```text
UX_CRITERIA
- Primary user goal:
- Success metric (time, completion, error reduction):
- High-frequency actions:
- Risky actions requiring safeguards:
- Empty/loading/error/success state plan:
```

If this block is missing, UX work is incomplete.

---

## Decision Matrix

### Modal vs Side Panel vs Full Page Form

- Use modal when fields are few and context is simple.
- Use side panel when user needs list context while editing.
- Use full page when form is long, multi-step, or high-risk.

### Inline Edit vs Dedicated Edit

- Inline edit for small, low-risk fields.
- Dedicated edit flow for multi-field or validated updates.

---

## UX Copy Rules

- Buttons use action verbs: "Create service", "Save changes".
- Error copy states cause + next step.
- Empty states include one useful CTA.
- Avoid vague labels like "Submit", "Okay", "Error".

---

## File Structure

```
components/
  dashboard/
    services-toolbar.tsx
    services-table.tsx
    service-form-panel.tsx
    service-delete-dialog.tsx
    states/
      services-empty-state.tsx
      services-error-state.tsx
      services-loading-state.tsx

lib/
  actions/
    services.ts

skills/
  generic/
    ux/
      SKILL.md
      references/
        prompt-cookbook.md
```

---

## Checklist Before Commit

- [ ] Primary CTA is visible without scrolling
- [ ] CRUD flow includes safe delete confirmation
- [ ] Empty/loading/error/success states are implemented
- [ ] Form fields have labels and field-level errors
- [ ] Recovery actions exist for failed operations
- [ ] Keyboard/focus flow remains usable
- [ ] UX_CRITERIA block is provided in implementation response

---

_Skill Version: 1.0.0 | Product UX patterns for dashboards, forms, and CRUD flows_
