// Unit test of the one security-relevant decision inside the adapter: which
// getUser() failures mean "nobody is signed in" (null / UnauthorizedError) and
// which are infrastructure failures that must NOT be mistaken for a logged-out
// user (SupabaseAdapterError). The client is a stub — no network.
import { describe, expect, it } from "vitest";
import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
  type AuthError,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { SupabaseAuthProvider } from "@/adapters/driven/supabase/supabase-auth-provider";
import { SupabaseAdapterError } from "@/adapters/driven/supabase/errors";
import { UnauthorizedError } from "@/domain/errors/domain-errors";

type GetUserResult = { data: { user: User | null }; error: AuthError | null };

function providerWhoseGetUserReturns(result: GetUserResult): SupabaseAuthProvider {
  const client = { auth: { getUser: async () => result } } as unknown as SupabaseClient;
  return new SupabaseAuthProvider(client);
}

const signedIn = (email: string | undefined): GetUserResult => ({
  data: { user: { id: "user-1", email } as unknown as User },
  error: null,
});

const failedWith = (error: AuthError): GetUserResult => ({ data: { user: null }, error });

describe("SupabaseAuthProvider — current user", () => {
  it("returns only the id and email of the signed-in user", async () => {
    const auth = providerWhoseGetUserReturns(signedIn("owner@example.test"));

    await expect(auth.getCurrentUser()).resolves.toEqual({ id: "user-1", email: "owner@example.test" });
    await expect(auth.getCurrentUserId()).resolves.toBe("user-1");
  });

  it("maps a missing email to null", async () => {
    const auth = providerWhoseGetUserReturns(signedIn(undefined));

    await expect(auth.getCurrentUser()).resolves.toEqual({ id: "user-1", email: null });
  });

  describe.each([
    ["no session", failedWith(new AuthSessionMissingError())],
    ["an expired or invalid token (401)", failedWith(new AuthApiError("invalid JWT", 401, "bad_jwt"))],
    ["no error but no user either", { data: { user: null }, error: null } as GetUserResult],
  ])("when the cause is %s", (_label, result) => {
    it("means nobody is signed in: null for getCurrentUser, UnauthorizedError for getCurrentUserId", async () => {
      const auth = providerWhoseGetUserReturns(result);

      await expect(auth.getCurrentUser()).resolves.toBeNull();
      await expect(auth.getCurrentUserId()).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe.each([
    ["a network failure", failedWith(new AuthRetryableFetchError("fetch failed", 0))],
    ["a server error (500)", failedWith(new AuthApiError("boom", 500, "unexpected_failure"))],
  ])("when the cause is %s", (_label, result) => {
    it("is an infrastructure failure, never mistaken for a logged-out user", async () => {
      const auth = providerWhoseGetUserReturns(result);

      await expect(auth.getCurrentUser()).rejects.toBeInstanceOf(SupabaseAdapterError);
      await expect(auth.getCurrentUserId()).rejects.toBeInstanceOf(SupabaseAdapterError);
    });
  });
});
