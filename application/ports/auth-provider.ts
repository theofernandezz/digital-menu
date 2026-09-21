// What the app knows about the signed-in user — deliberately not the auth
// provider's own user type, so nothing outside adapters/ depends on its shape.
export type SessionUser = { id: string; email: string | null };

export interface AuthProvider {
  // null means "not signed in"; an infrastructure failure throws instead.
  getCurrentUser(): Promise<SessionUser | null>;
  getCurrentUserId(): Promise<string>;
  assertOwnsRestaurant(userId: string, restaurantId: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}
