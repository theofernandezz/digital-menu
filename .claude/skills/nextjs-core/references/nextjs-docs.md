# Next.js References

## Official Documentation

- App Router: https://nextjs.org/docs/app
- Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- Streaming: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming

## Local References

### Key Files
- `app/layout.tsx` - Root layout
- `middleware.ts` - Request middleware
- `lib/actions/` - Server Actions

### Route Structure
```
app/
├── (marketing)/    # Public pages
│   ├── page.tsx    # Homepage
│   └── pricing/
├── (dashboard)/    # Protected routes
│   ├── layout.tsx  # Auth check
│   └── page.tsx
└── api/
    └── webhooks/   # External webhooks only
```

## Server Action Template

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const schema = z.object({ name: z.string().min(1) })

export async function action(formData: FormData) {
  const validated = schema.safeParse({ name: formData.get('name') })
  if (!validated.success) return { error: validated.error.flatten() }
  
  // Execute mutation
  revalidatePath('/path')
  return { success: true }
}
```
