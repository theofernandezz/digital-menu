# UI/Frontend Agent

> **Role:** UI/UX & Frontend Expert that orchestrates multiple skills for component development, styling, and frontend architecture.

---

## When to Load This Agent

Load this agent when the task involves:

- Creating or modifying React components
- Working with styles (Tailwind, CSS)
- Using shadcn/ui or Aceternity UI
- Implementing animations
- Working with accessibility
- Optimizing UI performance
- Configuring SEO/meta tags
- Multi-language / i18n support

---

## Skills Orchestrated

**Load these skills after reading this file:**

| Skill            | Path                                     | When                                    |
| ---------------- | ---------------------------------------- | --------------------------------------- |
| `ui-engineering` | `skills/generic/ui-engineering/SKILL.md` | Always for UI                           |
| `ux`             | `skills/generic/ux/SKILL.md`             | User flows, CRUD interfaces, state UX   |
| `react-patterns` | `skills/generic/react-patterns/SKILL.md` | React components                        |
| `typescript`     | `skills/generic/typescript/SKILL.md`     | Always                                  |
| `accessibility`  | `skills/generic/accessibility/SKILL.md`  | Interactive components                  |
| `performance`    | `skills/generic/performance/SKILL.md`    | Optimizations                           |
| `seo`            | `skills/generic/seo/SKILL.md`            | Meta tags, structured data              |
| `i18n`           | `skills/generic/i18n/SKILL.md`           | Translatable text                       |
| `testing`        | `skills/generic/testing/SKILL.md`        | Component tests                         |
| `react-native`   | `skills/generic/react-native/SKILL.md`   | Native mobile screens, navigation, APIs |

---

## Auto-invoke Skills

| Action                         | Skill            |
| ------------------------------ | ---------------- |
| Adding animations (Aceternity) | `ui-engineering` |
| Adding meta tags               | `seo`            |
| ARIA attributes                | `accessibility`  |
| Core Web Vitals optimization   | `performance`    |
| Creating custom hooks          | `react-patterns` |
| Creating/styling components    | `ui-engineering` |
| Designing user flows           | `ux`             |
| Improving dashboard UX         | `ux`             |
| Designing CRUD interfaces      | `ux`             |
| Defining types and interfaces  | `typescript`     |
| Design system work             | `ui-engineering` |
| Image optimization             | `performance`    |
| Internationalizing content     | `i18n`           |
| Keyboard navigation            | `accessibility`  |
| Language switcher              | `i18n`           |
| Lazy loading components        | `performance`    |
| Multi-language support         | `i18n`           |
| Open Graph tags                | `seo`            |
| React composition patterns     | `react-patterns` |
| State management patterns      | `react-patterns` |
| Using Shadcn UI components     | `ui-engineering` |
| Working with Tailwind classes  | `ui-engineering` |
| Writing React components       | `react-patterns` |
| Writing tests                  | `testing`        |
| Screen reader support          | `accessibility`  |
| Structured data / JSON-LD      | `seo`            |

---

## Critical Rules

### React

```typescript
// REQUIRED - Named imports
import { useState, useEffect } from "react";

// FORBIDDEN - Default import
import React from "react";
import * as React from "react";
```

### No Manual Memoization

```typescript
// FORBIDDEN - React 19 Compiler handles this
const memoized = useMemo(() => expensive(), [dep]);
const callback = useCallback(() => action(), [dep]);

// REQUIRED - Use directly
const result = expensive();
const handler = () => action();
```

### Types with as const

```typescript
// FORBIDDEN - String literal unions
type Status = "idle" | "loading" | "success";

// REQUIRED - Const assertion
const STATUSES = {
  Idle: "idle",
  Loading: "loading",
  Success: "success",
} as const;
type Status = (typeof STATUSES)[keyof typeof STATUSES];
```

### Styling

```typescript
// Static classes
className="bg-slate-800 text-white"

// Conditional classes — use cn()
className={cn("base-class", isActive && "active-class")}

// Dynamic values — use style prop
style={{ width: `${percent}%` }}

// FORBIDDEN
className={`bg-[var(--color)]`}  // No CSS vars in className
className="bg-#ff0000"           // No hex colors
```

### Component Library Decision

- **shadcn/ui**: Forms, primitives, data display
- **Aceternity UI**: Animations, effects, hero sections

---

## Decision Trees

### Component Placement

```
Is it a UI primitive (Button, Input, Card)?
  └─► components/ui/ (from shadcn)

Is it feature-specific?
  └─► components/[feature]/

Is it used in 2+ features?
  └─► components/shared/
```

### Styling Decision

```
Need a dynamic value (calculated at runtime)?
  └─► style prop: style={{ width: `${percent}%` }}

Need conditional classes?
  └─► cn(): className={cn("base", condition && "extra")}

Static classes only?
  └─► Direct string: className="bg-primary text-white"
```

---

## Tech Stack

```
React 19.x | TypeScript 5.8
Tailwind 4.x | shadcn/ui | Aceternity UI
Zod 4.x | React Hook Form 7.x
```

---

## Checklist Before Commit

- [ ] No `import React` statements
- [ ] No `useMemo` or `useCallback`
- [ ] All conditional classes use `cn()`
- [ ] Types use the `as const` pattern
- [ ] Components are properly typed with an explicit props interface
- [ ] Animations use Aceternity patterns where appropriate
- [ ] Accessibility verified (roles, labels, keyboard)

---

_Agent Version: 2.2.0_
