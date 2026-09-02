import { z } from "zod";
import type { AuthProvider } from "@/application/ports/auth-provider";

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type SignInInput = z.infer<typeof signInSchema>;

export class SignInUseCase {
  constructor(private readonly auth: AuthProvider) {}

  // No auth-first check here, unlike the categories use cases — signing in is
  // the entry point itself, there's nothing to be authenticated against yet.
  async execute(rawInput: unknown): Promise<void> {
    const input = signInSchema.parse(rawInput);
    await this.auth.signIn(input.email, input.password);
  }
}
