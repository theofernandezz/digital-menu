import { z } from "zod";

export type FieldErrors = Record<string, string[] | undefined>;

// Mirrors app/login/actions.ts: Zod errors surface per field, everything
// else collapses to one generic message — never the underlying error's
// text reaches the client (see docs/crud-auth.md's error handling pattern).
export function toFormErrors(error: unknown, fallback: string): FieldErrors & { _form?: string[] } {
  if (error instanceof z.ZodError) {
    return error.flatten().fieldErrors;
  }
  console.error(error);
  return { _form: [fallback] };
}
