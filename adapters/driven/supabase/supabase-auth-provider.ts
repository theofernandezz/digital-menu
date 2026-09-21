import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isAuthApiError, isAuthSessionMissingError } from "@supabase/supabase-js";
import type { AuthProvider, SessionUser } from "@/application/ports/auth-provider";
import { InvalidCredentialsError, UnauthorizedError } from "@/domain/errors/domain-errors";
import { SupabaseAdapterError } from "@/adapters/driven/supabase/errors";

export class SupabaseAuthProvider implements AuthProvider {
  constructor(private readonly client: SupabaseClient) {}

  async getCurrentUser(): Promise<SessionUser | null> {
    const user = await this.findVerifiedUser();
    return user ? { id: user.id, email: user.email ?? null } : null;
  }

  async getCurrentUserId(): Promise<string> {
    const user = await this.findVerifiedUser();
    if (!user) throw new UnauthorizedError();

    return user.id;
  }

  // getUser() (never getSession()) re-verifies the token against Supabase
  // Auth instead of trusting an unverified cookie value. Returns null only
  // when nobody is signed in.
  private async findVerifiedUser(): Promise<User | null> {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();

    if (error) {
      // A missing session or an expired/invalid token IS "not authenticated"
      // — that's the only case that maps to "no user". Anything else
      // (AuthRetryableFetchError from a network blip, a 5xx from Supabase,
      // ...) is an infra failure, not an authorization decision — masking it
      // as "logged out" makes a transient hiccup indistinguishable from an
      // actual logged-out user, which is exactly what made a real CI failure
      // hard to diagnose (see docs/build-plan.md).
      if (isAuthSessionMissingError(error) || (isAuthApiError(error) && error.status === 401)) {
        return null;
      }
      throw new SupabaseAdapterError("Failed to verify the current session", error);
    }

    return user;
  }

  async assertOwnsRestaurant(userId: string, restaurantId: string): Promise<void> {
    // Both id AND owner_id are filtered explicitly — restaurants' RLS ORs a
    // public-read policy (is_published) with the owner policy, so filtering
    // by id alone would let an authenticated user "prove" ownership of any
    // published restaurant that isn't theirs. See docs/crud-auth.md.
    const { data, error } = await this.client
      .from("restaurants")
      .select("id")
      .eq("id", restaurantId)
      .eq("owner_id", userId)
      .maybeSingle();

    if (error) throw new SupabaseAdapterError("Failed to verify restaurant ownership", error);
    if (!data) throw new UnauthorizedError();
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    // Never surface Supabase's own message (wrong password vs no such user
    // reveals which one it was) — one generic error regardless of cause.
    if (error) throw new InvalidCredentialsError();
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw new SupabaseAdapterError("Failed to sign out", error);
  }
}
