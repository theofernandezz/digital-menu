import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthProvider } from "@/application/ports/auth-provider";
import { InvalidCredentialsError, UnauthorizedError } from "@/domain/errors/domain-errors";
import { SupabaseAdapterError } from "@/adapters/driven/supabase/errors";

export class SupabaseAuthProvider implements AuthProvider {
  constructor(private readonly client: SupabaseClient) {}

  async getCurrentUserId(): Promise<string> {
    // getUser() (never getSession()) re-verifies the token against Supabase
    // Auth instead of trusting an unverified cookie value.
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();
    if (error || !user) throw new UnauthorizedError();
    return user.id;
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
