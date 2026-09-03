// Ported from scripts/verify-auth-slice.ts (now retired).
import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { signInUseCase, signOutUseCase } from "@/composition/container";
import { ZodError } from "zod";

function requireAdminCredentials(): { email: string; password: string } {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD must be set in .env.local");
  return { email, password };
}

describe("auth (integration)", () => {
  it("rejects a wrong password with the generic domain message, not Supabase's", async () => {
    const { email } = requireAdminCredentials();
    const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    await expect(signInUseCase(client).execute({ email, password: "definitely-wrong" })).rejects.toThrow(
      "Invalid email or password",
    );
  });

  it("creates a real session on correct credentials, and sign-out clears it", async () => {
    const { email, password } = requireAdminCredentials();
    const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    await signInUseCase(client).execute({ email, password });
    const { data: afterSignIn } = await client.auth.getSession();
    expect(afterSignIn.session).not.toBeNull();

    await signOutUseCase(client).execute();
    const { data: afterSignOut } = await client.auth.getSession();
    expect(afterSignOut.session).toBeNull();
  });

  it("rejects a malformed email before ever calling Supabase", async () => {
    const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    await expect(signInUseCase(client).execute({ email: "not-an-email", password: "" })).rejects.toThrow(ZodError);
  });
});
