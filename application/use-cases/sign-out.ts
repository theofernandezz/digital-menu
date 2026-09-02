import type { AuthProvider } from "@/application/ports/auth-provider";

export class SignOutUseCase {
  constructor(private readonly auth: AuthProvider) {}

  async execute(): Promise<void> {
    await this.auth.signOut();
  }
}
