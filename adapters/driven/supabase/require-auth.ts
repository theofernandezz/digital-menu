import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/adapters/driven/supabase/client";

// Lives here (not lib/auth/server.ts, the security skill's default) — it's a
// Supabase touchpoint, so it stays under the one folder allowed to be one.
// Used in Server Components / layouts, per docs/crud-auth.md's auth flow.
export async function requireAuth(): Promise<User> {
  const client = await createServerSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) redirect("/login");
  return user;
}
