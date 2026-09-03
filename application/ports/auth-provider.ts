export interface AuthProvider {
  getCurrentUserId(): Promise<string>;
  assertOwnsRestaurant(userId: string, restaurantId: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}
