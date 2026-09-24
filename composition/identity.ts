// Identity module: who is signed in. Wiring only — no logic lives here.
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAuthProvider } from "@/adapters/driven/supabase/supabase-auth-provider";
import { SignInUseCase } from "@/application/use-cases/sign-in";
import { SignOutUseCase } from "@/application/use-cases/sign-out";
import { GetCurrentUserUseCase } from "@/application/use-cases/get-current-user";

export function signInUseCase(client: SupabaseClient): SignInUseCase {
  return new SignInUseCase(new SupabaseAuthProvider(client));
}

export function signOutUseCase(client: SupabaseClient): SignOutUseCase {
  return new SignOutUseCase(new SupabaseAuthProvider(client));
}

export function getCurrentUserUseCase(client: SupabaseClient): GetCurrentUserUseCase {
  return new GetCurrentUserUseCase(new SupabaseAuthProvider(client));
}

// The identity module's public surface, as seen from app/.
export type IdentityUseCases = {
  signIn: SignInUseCase;
  signOut: SignOutUseCase;
  getCurrentUser: GetCurrentUserUseCase;
};

export function identityUseCases(client: SupabaseClient): IdentityUseCases {
  return {
    signIn: signInUseCase(client),
    signOut: signOutUseCase(client),
    getCurrentUser: getCurrentUserUseCase(client),
  };
}
