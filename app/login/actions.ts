"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/adapters/driven/supabase/client";
import { signInUseCase } from "@/composition/container";

export type SignInState = {
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
};

export async function signInAction(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const client = await createServerSupabaseClient();

  try {
    await signInUseCase(client).execute({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { errors: error.flatten().fieldErrors };
    }
    // Covers InvalidCredentialsError and anything else — one generic message,
    // never the underlying error's text (see domain-errors.ts).
    return { errors: { _form: ["Invalid email or password"] } };
  }

  // Outside the try/catch on purpose: redirect() throws NEXT_REDIRECT, which
  // would otherwise be caught and swallowed by the catch block above (the bug
  // flagged from database/SKILL.md's own example).
  redirect("/admin");
}
