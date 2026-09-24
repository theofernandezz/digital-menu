import type { AuthProvider, SessionUser } from "@/application/ports/auth-provider";

// null means nobody is signed in — deciding what to do about that (redirect
// to /login, return 401, ...) belongs to the driving adapter, not here.
export class GetCurrentUserUseCase {
  constructor(private readonly auth: AuthProvider) {}

  async execute(): Promise<SessionUser | null> {
    return this.auth.getCurrentUser();
  }
}
