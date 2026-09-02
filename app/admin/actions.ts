"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/adapters/driven/supabase/client";
import { signOutUseCase } from "@/composition/container";

// No FormData param needed — the sign-out button doesn't submit any fields.
// A function with fewer params than the form action's expected signature is
// still a valid target for `<form action={...}>` (Next.js/React ignore
// extra runtime args), and it avoids an always-unused parameter.
export async function signOutAction(): Promise<void> {
  const client = await createServerSupabaseClient();
  await signOutUseCase(client).execute();
  redirect("/login");
}
