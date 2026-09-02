---
name: UI Engineering - Distinctive Design
description: |
  Premium UI patterns with distinctive aesthetics. Anti "AI slop" design principles.
  Combines Tailwind v4, Shadcn UI, and Aceternity UI.
  Trigger: Activated when creating/styling components or working on UI patterns.
license: MIT
metadata:
  author: ai-library (merged with anthropics/skills frontend-design)
  version: "3.3"
  scope: [root, ui]
  auto_invoke:
    - "Creating/styling components"
    - "Working with Tailwind classes"
    - "Using Shadcn UI components"
    - "Adding animations (Aceternity)"
    - "Design system work"
    - "Building landing pages"
    - "Creating hero sections"
---

# UI Engineering - Distinctive Design

> **Core Principle:** Create distinctive, production-grade interfaces that feel intentional, not generic. Every design choice must be deliberate. Avoid "AI slop" aesthetics at all costs.

---

## 🆕 What's New

> **Instruction for Claude:** When this skill is loaded, check this table and mention any entry relevant to what the developer is working on — before writing code.

| Version | Change | Affects |
|---------|--------|---------|
| Tailwind v4 | CSS-first config — `tailwind.config.js` replaced by `@import "tailwindcss"` + CSS variables in your stylesheet | All Tailwind projects upgrading from v3 |
| Tailwind v4 | `@theme` directive — define design tokens directly in CSS instead of JS config | Custom colors, spacing, fonts |
| Tailwind v4 | `@utility` directive — create custom utilities without a plugin | One-off utility classes |
| shadcn/ui (2025) | `npx shadcn@latest add` — components now use CSS variables from Tailwind v4 theme by default | Any new shadcn component installs |

---

## 🚨 ANTI "AI SLOP" - Distinctive Design

Before writing ANY UI code, establish a **bold aesthetic direction**. Generic designs are rejected.

### The AI Slop Checklist (NEVER DO THESE)

| Anti-Pattern                    | Why It's Bad                     |
| ------------------------------- | -------------------------------- |
| Purple/blue gradients on white  | Overused, screams "AI generated" |
| Inter, Roboto, system fonts     | Generic, no personality          |
| Symmetric card grids            | Predictable, boring              |
| Generic hero with centered text | Seen a million times             |
| Rounded corners everywhere      | Safe but forgettable             |
| Stock-photo-style illustrations | Impersonal, corporate            |

### Design Thinking Process

Before coding, answer these questions:

```
1. PURPOSE: What problem does this solve? Who is the audience?
2. TONE: Pick ONE extreme direction:
   - Brutally minimal
   - Maximalist chaos
   - Retro-futuristic
   - Organic/natural
   - Luxury/refined
   - Playful/toy-like
   - Editorial/magazine
   - Brutalist/raw
   - Art deco/geometric
   - Industrial/utilitarian

3. MEMORABLE: What makes this design stick in memory?
4. CONSTRAINTS: What technical limits exist?
```

### Distinctive Design Principles

| Element        | Generic (BAD)       | Distinctive (GOOD)                                 |
| -------------- | ------------------- | -------------------------------------------------- |
| **Typography** | Inter, system-ui    | Space Grotesk, Clash Display, custom fonts         |
| **Color**      | Safe blue/purple    | Bold monochrome, unexpected accents, dark themes   |
| **Layout**     | Centered, symmetric | Asymmetric, overlapping, diagonal flow             |
| **Motion**     | Fade in/out         | Staggered reveals, scroll-triggered, physics-based |
| **Details**    | Plain backgrounds   | Textures, grain, gradients, decorative elements    |

### Creative Direction Contract (REQUIRED)

Before implementing UI, the AI must define this mini-brief and follow it:

```
1. DESIGN INTENT (1 sentence)
  Example: "Build a high-contrast editorial UI that feels like a modern magazine cover."

2. VISUAL PILLARS (pick exactly 3)
  - Typography attitude
  - Color attitude
  - Layout attitude
  - Motion attitude
  - Surface/background attitude

3. RISKY CHOICE (pick at least 1)
  A non-default decision that makes the design memorable.
  Example: giant left-aligned headline, monochrome palette + one neon accent,
  asymmetric section spacing, unconventional navigation placement.

4. USABILITY GUARDRAIL (pick at least 1)
  Keep accessibility and clarity intact despite bold visuals.
```

If this contract is missing, the design is considered incomplete.

### Variation Budget Rule

To avoid repetitive outputs, each new UI task must significantly differ from the previous baseline in at least 3 of these 5 axes:

1. Typography system
2. Color strategy
3. Layout structure
4. Motion language
5. Background/surface treatment

Do not reuse the same "safe" combination task after task.

### Reference Pool Strategy (REQUIRED)

References are encouraged for quality, but must be used for principles, not cloning.

#### Approved Reference Pool

Use these as inspiration sources:

- Stripe (structure, hierarchy, SaaS conversion clarity)
- Linear (product minimalism, typography discipline)
- Framer (expressive layout and motion)
- Vercel (technical clarity and restraint)
- Notion (content readability and calm interaction)
- Apple (storytelling rhythm and focus)
- Airbnb (conversion-driven UX and trust patterns)
- Figma (product communication and onboarding)
- Awwwards (bold visual direction; selective use)
- Mobbin / Land-book (pattern libraries and comparative references)

#### Reference Usage Rules

1. Pick at most 2 references per task:

- 1 for structure/UX
- 1 for visual/motion language

2. Never copy full layouts, section order, or component styling 1:1.
3. Extract principles only:

- hierarchy
- spacing rhythm
- interaction model
- motion pacing

4. Do not reuse the same reference pair in consecutive tasks.
5. If a reference is used repeatedly, force a different style family in the next task.

#### Style Family Rotation

Rotate across style families to maintain creativity:

- editorial
- brutalist
- playful
- luxury
- retro-futurist
- minimal

Avoid anchoring every task to one aesthetic.

### UI Response Format (REQUIRED)

For any UI implementation request, the AI response must include this block before code:

```text
UI_DIRECTION
- Intent: <1 sentence>
- Pillars: <exactly 3 pillars>
- References: <up to 2 from Approved Reference Pool, with what is borrowed from each>
- Risky Choice: <at least 1>
- Usability Guardrail: <at least 1>
- Variation Proof: <list at least 3 of the 5 variation axes changed>
```

If this block is missing, the UI response is considered non-compliant.

### Typography That Stands Out

```typescript
// ❌ GENERIC - Forgettable fonts
<h1 className="font-sans text-4xl">Welcome</h1>

// ✅ DISTINCTIVE - Characterful typography
<h1 className="font-clash text-5xl font-bold tracking-tight
               bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
  Welcome
</h1>

// Font pairing example
// Display: Clash Display, Space Grotesk, Cabinet Grotesk
// Body: Satoshi, General Sans, Switzer
```

### Color Commitment

```typescript
// ❌ GENERIC - Safe corporate blue
<div className="bg-blue-500 text-white">

// ✅ DISTINCTIVE - Committed dark theme with accent
<div className="bg-zinc-950 text-zinc-100 border border-zinc-800">
  <span className="text-lime-400">Accent</span>
</div>

// ✅ DISTINCTIVE - Bold monochrome with single accent
<div className="bg-black text-white">
  <button className="bg-[#ff5c00] text-black font-bold">
    Action
  </button>
</div>
```

### Spatial Composition

```typescript
// ❌ GENERIC - Centered everything
<div className="flex flex-col items-center justify-center text-center">

// ✅ DISTINCTIVE - Asymmetric, intentional
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-7 col-start-2">
    <h1 className="text-left text-6xl">Bold Statement</h1>
  </div>
  <div className="col-span-3 col-start-9 self-end">
    <p className="text-right text-sm text-muted">Supporting text</p>
  </div>
</div>
```

---

## 🎨 Design Philosophy: Distinctive Systems

High-quality UI systems are characterized by:

| Aspect                   | Description                                      |
| ------------------------ | ------------------------------------------------ |
| **Subtle Borders**       | 1px borders with low opacity (`border-white/10`) |
| **Glassmorphism**        | Backdrop blur with translucent backgrounds       |
| **Micro-interactions**   | Smooth transitions on every interactive element  |
| **Dark-first**           | Designed for dark mode, light mode as adaptation |
| **Depth through Shadow** | Layered shadows for elevation hierarchy          |
| **Precision Spacing**    | 4px grid system, consistent rhythm               |

---

## 🧩 Component Libraries: Shadcn UI vs Aceternity UI

Use **both libraries** strategically based on their strengths:

### Shadcn UI — Core Primitives & Forms

Use Shadcn for **functional, accessible components** that need to be reliable and composable.

| Component Type         | Examples                                                 |
| ---------------------- | -------------------------------------------------------- |
| **Form Controls**      | Input, Textarea, Select, Checkbox, Radio, Switch, Slider |
| **Dialogs & Overlays** | Dialog, Sheet, Popover, Tooltip, Dropdown Menu           |
| **Data Display**       | Table, Accordion, Tabs, Separator                        |
| **Feedback**           | Alert, Toast, Progress, Skeleton                         |
| **Navigation**         | Navigation Menu, Breadcrumb, Pagination                  |
| **Buttons & Actions**  | Button, Toggle, Toggle Group                             |

```tsx
// ✅ Use Shadcn for forms and core UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
```

### Aceternity UI — Animations & Visual Impact

Use Aceternity for **eye-catching, animated components** that create visual wow-factor.

| Component Type           | Examples                                          |
| ------------------------ | ------------------------------------------------- |
| **Hero Sections**        | Spotlight, Lamp, Vortex, Aurora Background        |
| **Backgrounds**          | Dot Background, Grid Background, Beams, Particles |
| **Cards & Containers**   | 3D Card, Hover Effect Cards, Glowing Cards        |
| **Text Effects**         | Text Generate, Typewriter, Text Reveal, Wavy Text |
| **Scroll Effects**       | Scroll Reveal, Parallax Scroll, Sticky Scroll     |
| **Interactive Elements** | Floating Dock, Moving Border, Sparkles            |
| **Navigation**           | Floating Navbar, Sidebar with animation           |

```tsx
// ✅ Use Aceternity for visual impact
import { SpotlightCard } from "@/components/aceternity/spotlight-card";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { TextGenerateEffect } from "@/components/aceternity/text-generate-effect";
import { FloatingDock } from "@/components/aceternity/floating-dock";
```

### Decision Matrix

| Need                        | Use            | Reason                                 |
| --------------------------- | -------------- | -------------------------------------- |
| Form with validation        | **Shadcn**     | Accessible, works with react-hook-form |
| Hero section for landing    | **Aceternity** | Visual impact, animations              |
| Modal/Dialog                | **Shadcn**     | Proper focus management, a11y          |
| Animated card hover effects | **Aceternity** | 3D transforms, glow effects            |
| Data table                  | **Shadcn**     | Sorting, filtering, pagination         |
| Background effects          | **Aceternity** | Beams, particles, grids                |
| Dropdown menu               | **Shadcn**     | Keyboard navigation, ARIA              |
| Text animations             | **Aceternity** | Typewriter, reveal effects             |
| Toast notifications         | **Shadcn**     | Consistent, accessible                 |
| Floating navigation         | **Aceternity** | Dock effect, animations                |

### File Organization

```
components/
├── ui/                    # Shadcn primitives
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── aceternity/            # Aceternity components
│   ├── spotlight-card.tsx
│   ├── background-beams.tsx
│   ├── text-generate-effect.tsx
│   └── ...
├── patterns/              # Composed patterns (mix both)
│   ├── hero-section.tsx   # Aceternity background + Shadcn CTAs
│   └── feature-card.tsx   # Aceternity effects + Shadcn content
└── [feature]/
    └── ...
```

---

## 🚫 FORBIDDEN PATTERNS

### 1. Never Use Generic "AI Slop" Aesthetics

```typescript
// ❌ FORBIDDEN - Purple gradient hero (AI slop)
<div className="bg-gradient-to-r from-purple-500 to-blue-500">
  <h1 className="text-center text-white">Welcome to Our Platform</h1>
</div>

// ❌ FORBIDDEN - Generic font stack
<h1 className="font-sans">  // Inter, system-ui = forgettable

// ❌ FORBIDDEN - Safe, predictable layouts
<div className="grid grid-cols-3 gap-4">  // Symmetric grids everywhere
  <Card /><Card /><Card />
</div>

// ✅ CORRECT - Distinctive, intentional design
<div className="bg-zinc-950 border-b border-zinc-800">
  <h1 className="font-clash text-6xl tracking-tight text-left max-w-3xl">
    Ship faster.<br/>
    <span className="text-zinc-500">Break nothing.</span>
  </h1>
</div>
```

### 1.1 Never Fall Back to Default Safe Theme

```typescript
// ❌ FORBIDDEN - Reused default recipe
// Same centered hero + same neutral cards + same blue CTA every time

// ✅ REQUIRED - Commit to a distinctive direction per task
// Change at least 3 axes: type, color, layout, motion, surface
```

### 2. Never Use `@apply` in CSS

`@apply` defeats Tailwind's purpose and creates maintenance nightmares.

```css
/* ❌ FORBIDDEN - Creates hidden dependencies */
.custom-button {
  @apply bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600;
}

/* ✅ CORRECT - Use component composition */
```

```typescript
// Button component with configurable variants
const Button = ({ variant = 'primary', ...props }) => (
  <button
    className={cn(
      "px-4 py-2 rounded-lg transition-colors",
      variant === 'primary' && "bg-blue-500 text-white hover:bg-blue-600",
      variant === 'secondary' && "bg-gray-100 text-gray-800 hover:bg-gray-200"
    )}
    {...props}
  />
)
```

### 3. Never Hardcode Colors

Always use design tokens for consistency and theming.

```typescript
// ❌ FORBIDDEN - Hardcoded colors
<div className="bg-[#1a1a2e] text-[#ffffff]">

// ✅ CORRECT - Design tokens via CSS variables
<div className="bg-background text-foreground">

// ✅ CORRECT - Semantic color names
<div className="bg-card text-card-foreground border-border">
```

### 4. Never Skip Transitions

Every state change needs smooth transitions.

```typescript
// ❌ FORBIDDEN - Jarring state changes
<button className="bg-primary hover:bg-primary-dark">

// ✅ CORRECT - Smooth transitions
<button className="bg-primary hover:bg-primary-dark transition-colors duration-150">

// ✅ BETTER - Include transform for depth
<button className="bg-primary hover:bg-primary-dark hover:scale-[1.02]
                   transition-all duration-150 active:scale-[0.98]">
```

---

## ✅ REQUIRED PATTERNS

### 1. The `cn()` Utility is Mandatory

All className assemblies MUST use the `cn()` utility for merge conflict resolution.

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```typescript
// Usage in components
import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  variant?: 'default' | 'glass'
  children: React.ReactNode
}

export function Card({ className, variant = 'default', children }: CardProps) {
  return (
    <div
      className={cn(
        // Base styles
        "rounded-xl border p-6",
        // Variant styles
        variant === 'default' && "bg-card border-border",
        variant === 'glass' && [
          "bg-white/5 border-white/10",
          "backdrop-blur-xl backdrop-saturate-150",
          "shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        ],
        // Allow override
        className
      )}
    >
      {children}
    </div>
  )
}
```

### 2. Glassmorphism Implementation

```typescript
// Glass card component
export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        // Glass effect base
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-white/10 to-white/5",
        "border border-white/10",
        "backdrop-blur-xl",

        // Subtle inner glow
        "before:absolute before:inset-0",
        "before:bg-gradient-to-br before:from-white/5 before:to-transparent",
        "before:rounded-2xl before:pointer-events-none",

        // Shadow for depth
        "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
        "shadow-black/20",

        className
      )}
    >
      {children}
    </div>
  )
}

// Glass input field
export function GlassInput({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full px-4 py-3 rounded-lg",
        "bg-white/5 border border-white/10",
        "text-foreground placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        "focus:border-primary/50",
        "transition-all duration-200",
        className
      )}
      {...props}
    />
  )
}
```

### 3. Micro-Interactions Library

```typescript
// Hover lift effect
const hoverLift = "hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"

// Press effect
const pressEffect = "active:scale-[0.98] transition-transform duration-75"

// Focus ring (accessible)
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

// Shimmer loading effect
const shimmer = `
  relative overflow-hidden
  before:absolute before:inset-0
  before:-translate-x-full before:animate-[shimmer_2s_infinite]
  before:bg-gradient-to-r before:from-transparent
  before:via-white/10 before:to-transparent
`

// Usage in component
export function InteractiveCard({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      "p-6 rounded-xl bg-card border border-border",
      "cursor-pointer select-none",
      hoverLift,
      pressEffect,
      focusRing
    )}>
      {children}
    </div>
  )
}
```

### 4. Animation Keyframes (Tailwind v4)

```css
/* globals.css */
@theme {
  --animate-shimmer: shimmer 2s infinite;
  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-slide-up: slide-up 0.3s ease-out;
  --animate-scale-in: scale-in 0.2s ease-out;
  --animate-pulse-soft: pulse-soft 2s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse-soft {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
```

### 5. Component Composition over Configuration

```typescript
// ❌ AVOID - Prop-heavy components
<Button
  variant="primary"
  size="large"
  icon={<Plus />}
  iconPosition="left"
  loading={isLoading}
  disabled={isDisabled}
  fullWidth
  rounded="lg"
>
  Create Project
</Button>

// ✅ PREFERRED - Composition pattern
<Button size="lg" className="w-full">
  {isLoading ? (
    <Spinner className="size-4" />
  ) : (
    <Plus className="size-4" />
  )}
  Create Project
</Button>

// ✅ EVEN BETTER - Slot pattern for complex layouts
<Card>
  <Card.Header>
    <Card.Title>Settings</Card.Title>
    <Card.Description>Manage your preferences</Card.Description>
  </Card.Header>
  <Card.Content>
    {/* Content */}
  </Card.Content>
  <Card.Footer>
    <Button variant="ghost">Cancel</Button>
    <Button>Save</Button>
  </Card.Footer>
</Card>
```

---

## 🎨 Color System (Dark-First)

```css
/* globals.css - Design Tokens */
@layer base {
  :root {
    /* Light mode */
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --border: 240 5.9% 90%;
  }

  .dark {
    /* Dark mode - high contrast baseline */
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 6%;
    --card-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --muted: 240 5% 15%;
    --muted-foreground: 240 5% 55%;
    --border: 240 5% 15%;

    /* Accent colors */
    --accent-blue: 217 91% 60%;
    --accent-purple: 262 83% 58%;
    --accent-green: 142 71% 45%;
    --accent-orange: 24 95% 53%;
    --accent-red: 0 84% 60%;
  }
}
```

---

## 📐 Spacing System

Follow an 8px base grid with 4px for fine adjustments.

```typescript
// Spacing scale (Tailwind default + custom)
const spacing = {
  px: '1px',
  0.5: '2px',   // Fine adjustment
  1: '4px',     // Fine adjustment
  2: '8px',     // Base unit
  3: '12px',
  4: '16px',    // 2x base
  5: '20px',
  6: '24px',    // 3x base
  8: '32px',    // 4x base
  10: '40px',
  12: '48px',   // 6x base
  16: '64px',   // 8x base
}

// ✅ CORRECT - Consistent spacing
<div className="p-6 space-y-4">      {/* 24px padding, 16px gap */}
  <h2 className="mb-2">Title</h2>     {/* 8px margin */}
  <p className="mt-1">Description</p> {/* 4px margin */}
</div>

// ❌ AVOID - Arbitrary values break rhythm
<div className="p-[22px] space-y-[18px]">
```

---

## 🧱 Component Architecture

```
components/
├── ui/                    # Shadcn primitives (forms, dialogs, data)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── dialog.tsx
├── aceternity/            # Aceternity effects (animations, backgrounds)
│   ├── spotlight-card.tsx
│   ├── background-beams.tsx
│   └── floating-dock.tsx
├── patterns/              # Composed patterns (mix both libraries)
│   ├── form-field.tsx
│   ├── page-header.tsx
│   └── empty-state.tsx
└── [feature]/             # Feature-specific
    ├── project-card.tsx
    └── task-list.tsx
```

### Pattern Component Example

```typescript
// components/patterns/page-header.tsx
interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Usage
<PageHeader
  title="Projects"
  description="Manage your active projects"
  action={<Button><Plus className="size-4 mr-2" /> New Project</Button>}
/>
```

---

## 📱 Responsive Design

Mobile-first with intentional breakpoints.

```typescript
// Breakpoint strategy
const breakpoints = {
  sm: '640px',   // Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Large screens
}

// ✅ Mobile-first pattern
<div className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2 sm:gap-6
  lg:grid-cols-3
  xl:grid-cols-4
">

// ✅ Hide/show responsive elements
<nav className="hidden md:flex">        {/* Hidden on mobile */}
<MobileNav className="md:hidden" />     {/* Shown only on mobile */}
```

---

## 📝 Forms UX (Web Design Guidelines)

### Labels & Placeholders

```tsx
// ❌ BAD - Placeholder as label (disappears on focus)
<input placeholder="Email address" />

// ✅ GOOD - Visible label + helpful placeholder
<div>
  <Label htmlFor="email">Email address</Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
    aria-describedby="email-hint"
  />
  <p id="email-hint" className="text-sm text-muted-foreground">
    We'll never share your email
  </p>
</div>
```

### Error States

```tsx
// ❌ BAD - Generic error, no context
<Input className="border-red-500" />
<p className="text-red-500">Error</p>

// ✅ GOOD - Specific error, associated with field
<div>
  <Label htmlFor="password">Password</Label>
  <Input
    id="password"
    type="password"
    aria-invalid={!!error}
    aria-describedby={error ? "password-error" : undefined}
    className={cn(error && "border-destructive focus-visible:ring-destructive")}
  />
  {error && (
    <p id="password-error" role="alert" className="text-sm text-destructive mt-1">
      Password must be at least 8 characters
    </p>
  )}
</div>
```

### Form Submission Feedback

```tsx
// ✅ REQUIRED - Disable during submit, show loading state
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    "Save changes"
  )}
</Button>;

// ✅ REQUIRED - Success/error feedback after submit
{
  submitStatus === "success" && (
    <Alert variant="success">
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>Changes saved successfully</AlertDescription>
    </Alert>
  );
}
```

### Input Types & Autocomplete

```tsx
// ✅ Use correct input types for mobile keyboards
<Input type="email" autoComplete="email" />           // Email keyboard
<Input type="tel" autoComplete="tel" />               // Phone keyboard
<Input type="url" autoComplete="url" />               // URL keyboard
<Input type="number" inputMode="numeric" />           // Number keyboard

// ✅ Use autocomplete for faster form filling
<Input name="name" autoComplete="name" />
<Input name="email" autoComplete="email" />
<Input name="street-address" autoComplete="street-address" />
<Input name="cc-number" autoComplete="cc-number" />
```

---

## 👆 Touch & Mobile UX

### Touch Target Sizes

```tsx
// ❌ BAD - Too small for touch (< 44px)
<button className="p-1 text-sm">×</button>

// ✅ GOOD - Minimum 44x44px touch target
<button className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center">
  <X className="h-5 w-5" />
  <span className="sr-only">Close</span>
</button>

// ✅ GOOD - Expand touch area without expanding visual
<button className="relative p-2 after:absolute after:inset-[-8px] after:content-['']">
  <Settings className="h-4 w-4" />
</button>
```

### Touch Feedback

```tsx
// ✅ REQUIRED - Visual feedback on touch
<button
  className={cn(
    "transition-all duration-150",
    // Touch feedback
    "active:scale-95 active:opacity-80",
    // Hover styles should be separated with media queries in CSS when needed
    "hover:bg-accent"
  )}
>
  Action
</button>

/* Optional CSS gate for hover-capable devices */
@media (hover: none) {
  .touch-no-hover:hover {
    background: inherit;
  }
}
```

### Swipe & Gestures

```tsx
// ✅ Use established gesture patterns
// - Swipe left/right: Delete, archive, actions
// - Pull down: Refresh
// - Swipe up: Dismiss
// - Long press: Context menu

// ✅ Always provide alternative (button) for gestures
<div className="flex items-center justify-between">
  <span>Item name</span>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Edit</DropdownMenuItem>
      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

### Safe Areas (Notches & Home Indicators)

```css
/* ✅ Respect device safe areas */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}

.full-screen-modal {
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
}
```

```tsx
// Tailwind equivalent
<nav className="fixed bottom-0 pb-[env(safe-area-inset-bottom)]">
  {/* Bottom navigation */}
</nav>
```

### Prevent Accidental Actions

```tsx
// ✅ Confirm destructive actions
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete Account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive">
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

// ✅ Add spacing between destructive and safe actions
<div className="flex gap-4">  {/* gap-4 = 16px minimum */}
  <Button variant="outline">Cancel</Button>
  <Button variant="destructive">Delete</Button>
</div>
```

---

## 📋 UI Checklist Before Commit

### Design Quality

- [ ] Design has a clear, intentional aesthetic direction
- [ ] Creative Direction Contract is explicitly defined before implementation
- [ ] References are chosen from the approved pool and used as principles only
- [ ] No purple/blue gradient heroes (AI slop)
- [ ] Typography is distinctive (not Inter/Roboto/system)
- [ ] Layout has intentional asymmetry or visual interest
- [ ] Color palette is committed, not safe/generic
- [ ] At least one risky visual choice is present
- [ ] Output differs from baseline in at least 3/5 variation axes
- [ ] Response includes the required `UI_DIRECTION` block
- [ ] Reference pair is not reused from the immediately previous task

### Technical Quality

- [ ] All classNames use `cn()` utility
- [ ] No `@apply` in CSS files
- [ ] No hardcoded color values (use tokens)
- [ ] All interactive elements have transitions
- [ ] Hover, focus, and active states defined
- [ ] Dark mode tested
- [ ] Responsive at all breakpoints
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Focus states are accessible (visible ring)

### Forms UX

- [ ] All inputs have visible labels (not just placeholders)
- [ ] Error messages are specific and associated with fields
- [ ] Submit button shows loading state during submission
- [ ] Success/error feedback after form submission
- [ ] Correct input types for mobile keyboards (email, tel, url)
- [ ] Autocomplete attributes for faster form filling

### Touch & Mobile UX

- [ ] Touch targets are minimum 44x44px
- [ ] Touch feedback on interactive elements (active:scale)
- [ ] Safe areas respected (notches, home indicators)
- [ ] Destructive actions have confirmation dialogs
- [ ] Gestures have button alternatives

### Final Check

Ask yourself: **"Would this design be memorable or forgettable?"**
If forgettable, iterate on the aesthetic direction.

---

_Skill Version: 3.3.0 | Merged with Anthropic frontend-design | Tailwind v4, Shadcn UI & Aceternity UI_
