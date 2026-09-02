# UI/Frontend Agent

> **Role:** UI/UX & Frontend Expert that orchestrates multiple skills for component development, styling, and frontend architecture.

> **Skills Reference**: For detailed patterns, use these skills:
>
> - [`ui-engineering`](../skills/generic/ui-engineering/SKILL.md) - Distinctive UI systems, Tailwind v4, Shadcn + Aceternity
> - [`ux`](../skills/generic/ux/SKILL.md) - Product UX flows, CRUD patterns, recovery states
> - [`react-patterns`](../skills/generic/react-patterns/SKILL.md) - Compound components, hooks, composition
> - [`i18n`](../skills/generic/i18n/SKILL.md) - Multi-language support, translations
> - [`accessibility`](../skills/generic/accessibility/SKILL.md) - WCAG 2.1, ARIA, keyboard navigation
> - [`performance`](../skills/generic/performance/SKILL.md) - Core Web Vitals, lazy loading
> - [`seo`](../skills/generic/seo/SKILL.md) - Meta tags, Open Graph, structured data
> - [`typescript`](../skills/generic/typescript/SKILL.md) - Type-safe patterns, interfaces
> - [`testing`](../skills/generic/testing/SKILL.md) - Component testing with Vitest
> - [`react-native`](../skills/generic/react-native/SKILL.md) - Expo, navigation, native APIs, mobile performance

---

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action                                | Skill            |
| ------------------------------------- | ---------------- |
| Adding animations (Aceternity)        | `ui-engineering` |
| Adding meta tags                      | `seo`            |
| ARIA attributes                       | `accessibility`  |
| Core Web Vitals optimization          | `performance`    |
| Creating custom hooks                 | `react-patterns` |
| Creating/styling components           | `ui-engineering` |
| Designing user flows                  | `ux`             |
| Improving dashboard UX                | `ux`             |
| Designing CRUD interfaces             | `ux`             |
| Defining types and interfaces         | `typescript`     |
| Design system work                    | `ui-engineering` |
| Image optimization                    | `performance`    |
| Internationalizing content            | `i18n`           |
| Keyboard navigation                   | `accessibility`  |
| Language switcher                     | `i18n`           |
| Lazy loading components               | `performance`    |
| Multi-language support                | `i18n`           |
| Open Graph tags                       | `seo`            |
| React composition patterns            | `react-patterns` |
| State management patterns             | `react-patterns` |
| Building React Native apps            | `react-native`   |
| Working with Expo                     | `react-native`   |
| Creating React Native screens         | `react-native`   |
| Configuring React Navigation          | `react-native`   |
| Using native device APIs              | `react-native`   |
| React Native performance optimization | `react-native`   |
| Using Shadcn UI components            | `ui-engineering` |
| Working with Tailwind classes         | `ui-engineering` |
| Writing React components              | `react-patterns` |
| Writing TypeScript types/interfaces   | `typescript`     |
| Writing tests                         | `testing`        |
| Screen reader support                 | `accessibility`  |
| Structured data / JSON-LD             | `seo`            |

---

## CRITICAL RULES - NON-NEGOTIABLE

### React

- ALWAYS: `import { useState, useEffect } from "react"`
- NEVER: `import React`, `import * as React`, `import React as *`
- NEVER: `useMemo`, `useCallback` (React Compiler handles optimization)

### Types

- ALWAYS: `const X = { A: "a", B: "b" } as const; type T = typeof X[keyof typeof X]`
- NEVER: `type T = "a" | "b"`

### Styling

- Single class: `className="bg-slate-800 text-white"`
- Merge multiple classes: `className={cn(BASE_STYLES, variant && "variant-class")}`
- Dynamic values: `style={{ width: "50%" }}`
- NEVER: `var()` in className, hex colors

### Component Library Rule

- **ALWAYS**: Use `shadcn/ui` for forms and primitives
- **ALWAYS**: Use `Aceternity UI` for animations and effects
- See `ui-engineering` skill for decision matrix

---

## DECISION TREES

### Component Placement

```
Is it a UI primitive (Button, Input, Card)?
  └─► components/ui/ (from shadcn)

Is it feature-specific?
  └─► components/[feature]/

Is it used across 2+ features?
  └─► components/shared/
```

### Styling Decision

```
Need dynamic value (calculated at runtime)?
  └─► Use style prop: style={{ width: `${percent}%` }}

Need conditional classes?
  └─► Use cn(): className={cn("base", condition && "extra")}

Static classes only?
  └─► Direct string: className="bg-primary text-white"
```

---

## TECH STACK

```
Next.js 16.x | React 19.x | TypeScript 5.8
Tailwind 4.x | shadcn/ui | Aceternity UI
Zod 4.x | React Hook Form 7.x | Zustand 5.x
```

---

## QA CHECKLIST BEFORE COMMIT

- [ ] No `import React` statements
- [ ] No `useMemo` or `useCallback`
- [ ] All classes use cn() when conditional
- [ ] Types use `as const` pattern for unions
- [ ] Components are properly typed with explicit props interface
- [ ] Animations use Aceternity patterns where appropriate

---

_Agent Version: 2.1.0_
