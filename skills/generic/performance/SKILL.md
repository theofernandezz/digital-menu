---
name: Performance Optimization
description: |
  Performance patterns for fast web applications. Core Web Vitals, lazy loading, image optimization.
  Trigger: Activated when optimizing performance, loading times, or Core Web Vitals.
license: MIT
metadata:
  author: ai-library
  version: "2.0"
  scope: [root, ui, backend]
  auto_invoke:
    - "Optimizing performance"
    - "Improving load times"
    - "Core Web Vitals"
    - "Lazy loading"
    - "Image optimization"
---

# Performance Optimization

> **Core Principle:** Performance is a feature. Every millisecond counts for user experience and SEO.

---

## 🆕 What's New

> **Instruction for Claude:** When this skill is loaded, check this table and mention any entry relevant to what the developer is working on — before writing code.

| Version | Change | Affects |
|---------|--------|---------|
| Next.js 16.2 | Cache Components architecture replaces PPR (Partial Pre-rendering) — static segments cached in segment cache | Pages mixing static and dynamic content |
| Next.js 16.2 | `experimental.prefetchInlining` — bundles segment prefetches into a single response | Navigation-heavy apps |
| Next.js 16.2 | `images.maximumDiskCacheSize` — LRU disk cache limit for `next/image` (was unbounded) | Apps with large image sets |

---

## 📊 Core Web Vitals Targets

| Metric | Target | What It Measures |
|--------|--------|------------------|
| **LCP** | < 2.5s | Largest Contentful Paint - Loading |
| **INP** | < 200ms | Interaction to Next Paint - Interactivity |
| **CLS** | < 0.1 | Cumulative Layout Shift - Visual Stability |

---

## 🚫 FORBIDDEN PATTERNS

### 1. Never Load Large Libraries on Initial Bundle

```typescript
// ❌ FORBIDDEN - Heavy import in main bundle
import moment from 'moment' // 300KB+
import * as lodash from 'lodash' // 70KB+

// ✅ CORRECT - Use native or lightweight alternatives
// For dates
import { format, parseISO } from 'date-fns' // Tree-shakable

// For utilities - native methods
const unique = [...new Set(array)]
const grouped = Object.groupBy(array, (item) => item.category)
```

### 2. Never Import Entire Icon Libraries

```typescript
// ❌ FORBIDDEN - Imports entire library
import * as Icons from 'lucide-react'
import { Icons } from '@radix-ui/react-icons'

// ✅ CORRECT - Import only what you need
import { Search, Menu, X } from 'lucide-react'
```

### 3. Never Use Layout-Causing CSS Properties in Animations

```css
/* ❌ FORBIDDEN - Causes layout recalculation */
.animate {
  animation: slide 0.3s;
}

@keyframes slide {
  from { left: 0; width: 0; }
  to { left: 100px; width: 100px; }
}

/* ✅ CORRECT - Use transform and opacity only */
.animate {
  animation: slide 0.3s;
}

@keyframes slide {
  from { transform: translateX(0); opacity: 0; }
  to { transform: translateX(100px); opacity: 1; }
}
```

### 4. Never Cause Cumulative Layout Shift

```typescript
// ❌ FORBIDDEN - No dimensions, causes CLS
<img src="/hero.jpg" />

// ❌ FORBIDDEN - Dynamic content without space
{isLoaded && <div className="banner">...</div>}

// ✅ CORRECT - Always specify dimensions
<Image src="/hero.jpg" width={1200} height={600} alt="Hero" />

// ✅ CORRECT - Reserve space for dynamic content
<div className="min-h-[100px]">
  {isLoaded ? <Banner /> : <Skeleton />}
</div>
```

---

## ✅ REQUIRED PATTERNS

### 1. Image Optimization with Next.js

```typescript
import Image from 'next/image'

// ✅ REQUIRED - Use Next.js Image component
<Image
  src="/hero.jpg"
  alt="Hero banner"
  width={1200}
  height={600}
  priority // For above-the-fold images
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>

// ✅ Responsive images
<Image
  src="/feature.jpg"
  alt="Feature"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  className="object-cover"
/>
```

### 2. Lazy Loading Components

```typescript
// ✅ Lazy load heavy components
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('@/components/chart'), {
  loading: () => <Skeleton className="h-[400px]" />,
  ssr: false, // If it needs browser APIs
})

const RichTextEditor = dynamic(
  () => import('@/components/rich-text-editor'),
  { ssr: false }
)

// ✅ Lazy load below-the-fold sections
const Testimonials = dynamic(() => import('./testimonials'))
const FAQ = dynamic(() => import('./faq'))
```

### 3. Code Splitting with Route Groups

```
app/
├── (marketing)/        # Separate bundle
│   ├── page.tsx
│   └── pricing/
├── (dashboard)/        # Separate bundle
│   ├── layout.tsx
│   └── page.tsx
└── (auth)/             # Separate bundle
    ├── login/
    └── register/
```

### 4. Streaming and Suspense

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div>
      {/* Render immediately */}
      <h1>Dashboard</h1>

      {/* Stream in as ready */}
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />
      </Suspense>
    </div>
  )
}

// Each component can be an async Server Component
async function Stats() {
  const stats = await getStats() // This can take time
  return <StatsCards data={stats} />
}
```

### 5. Preloading Critical Resources

```typescript
// app/layout.tsx
import { preload } from 'react-dom'

export default function RootLayout({ children }) {
  // Preload critical fonts
  preload('/fonts/inter-var.woff2', {
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  })

  return (
    <html>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://analytics.example.com" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 6. Font Optimization

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Prevents FOIT
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  return (
    <html className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

### 7. Memoization for Expensive Computations

```typescript
// ✅ Cache expensive operations
import { cache } from 'react'

export const getUser = cache(async (id: string) => {
  const user = await db.users.findUnique({ where: { id } })
  return user
})

// ✅ Memoize expensive client computations
import { useMemo } from 'react'

function DataTable({ data, filters }) {
  const filteredData = useMemo(() => {
    return data.filter(item => matchesFilters(item, filters))
  }, [data, filters])

  return <Table data={filteredData} />
}
```

### 8. Optimizing Third-Party Scripts

```typescript
// app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}

        {/* Load analytics after page is interactive */}
        <Script
          src="https://analytics.example.com/script.js"
          strategy="afterInteractive"
        />

        {/* Load non-critical scripts when idle */}
        <Script
          src="https://chat-widget.example.com/widget.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
```

---

## 📦 Bundle Analysis

```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

```typescript
// next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer({
  // ... config
})
```

---

## ⚡ Next.js Config Optimizations

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // React Compiler (React 19+) - auto-memoizes components and hooks.
  // Replaces the need for manual useMemo/useCallback in most cases.
  // Run `npx react-compiler-healthcheck` first to verify your codebase is compatible.
  experimental: {
    reactCompiler: true,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },

  // Compress responses
  compress: true,

  // Generate source maps only in dev
  productionBrowserSourceMaps: false,
}

export default nextConfig
```

> **React Compiler note:** With `reactCompiler: true`, you can remove most manual `useMemo` and `useCallback` calls. The compiler infers when memoization is needed. Keep explicit memoization only when performance-testing shows it's needed.


---

## 📊 Real User Monitoring

Add Speed Insights for Core Web Vitals from real users (not just Lighthouse).

```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />  {/* Real CWV data from users */}
        <Analytics />     {/* Page view analytics */}
      </body>
    </html>
  )
}
```

---

## 📋 Checklist Before Commit

- [ ] Images use Next.js Image component with dimensions
- [ ] Heavy components are lazy loaded
- [ ] No full library imports (tree-shake)
- [ ] Animations use transform/opacity only
- [ ] Critical resources are preloaded
- [ ] Third-party scripts use appropriate strategy
- [ ] No CLS from dynamic content
- [ ] Bundle size checked with analyzer

---

*Skill Version: 1.0.0 | Next.js 16.x Optimizations*
