import { z } from "zod";

// Server-only for now — nothing in this slice runs in the browser bundle
// (no browser-client.ts, see docs/architecture.md). Split into public/server
// schemas if a Client Component ever needs env vars directly.
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = envSchema.parse(process.env);
