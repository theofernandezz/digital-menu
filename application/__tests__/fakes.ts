// In-memory fakes for every outbound port — the payoff docs/architecture.md
// names explicitly: unit tests for use cases inject these instead of a real
// Supabase adapter. No network, no test database, fast and deterministic.
//
// These do the MINIMUM to satisfy each port's contract for testing use-case
// orchestration (auth-first ordering, validation, business-rule errors) —
// they deliberately do NOT reproduce adapter-specific implementation details
// like SupabaseTagRepository's case-insensitive matching. That's exercised
// only by the real adapter's integration test.
import { Category } from "@/domain/entities/category";
import { DiningTable } from "@/domain/entities/dining-table";
import { MenuItem } from "@/domain/entities/menu-item";
import { Restaurant } from "@/domain/entities/restaurant";
import { Tag } from "@/domain/entities/tag";
import type { PlacedOrder } from "@/domain/entities/placed-order";
import { UnauthorizedError } from "@/domain/errors/domain-errors";
import { AlreadyOpenError, DuplicateTableNumberError } from "@/domain/errors/table-errors";
import type { AuthProvider, SessionUser } from "@/application/ports/auth-provider";
import type { CategoryRepository } from "@/application/ports/category-repository";
import type { DiningTableRepository } from "@/application/ports/dining-table-repository";
import type { MenuItemRepository } from "@/application/ports/menu-item-repository";
import type { OrderRepository, PlaceOrderCommand } from "@/application/ports/order-repository";
import type { RestaurantRepository } from "@/application/ports/restaurant-repository";
import type { TagRepository } from "@/application/ports/tag-repository";

// Fixed fixture UUIDs, reused across every use-case test — Zod schemas
// require real UUID format, plain strings like "restaurant-1" would fail
// validation before ever reaching the fake.
export const FAKE_USER_ID = "00000000-0000-4000-8000-000000000001";
export const FAKE_RESTAURANT_ID = "00000000-0000-4000-8000-000000000002";

export class FakeAuthProvider implements AuthProvider {
  currentUserId: string | null = FAKE_USER_ID;
  currentEmail: string | null = "owner@example.test";
  ownedRestaurantIds = new Set<string>([FAKE_RESTAURANT_ID]);
  signInError: Error | null = null;
  signOutCalled = false;

  async getCurrentUser(): Promise<SessionUser | null> {
    if (!this.currentUserId) return null;
    return { id: this.currentUserId, email: this.currentEmail };
  }

  async getCurrentUserId(): Promise<string> {
    if (!this.currentUserId) throw new UnauthorizedError();
    return this.currentUserId;
  }

  async assertOwnsRestaurant(_userId: string, restaurantId: string): Promise<void> {
    if (!this.ownedRestaurantIds.has(restaurantId)) throw new UnauthorizedError();
  }

  async signIn(_email: string, _password: string): Promise<void> {
    if (this.signInError) throw this.signInError;
  }

  async signOut(): Promise<void> {
    this.signOutCalled = true;
  }
}

export class FakeCategoryRepository implements CategoryRepository {
  private readonly categories = new Map<string, Category>();

  seed(category: Category): void {
    this.categories.set(category.id, category);
  }

  async findByRestaurant(restaurantId: string): Promise<Category[]> {
    return [...this.categories.values()]
      .filter((c) => c.restaurantId === restaurantId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async findById(id: string): Promise<Category | null> {
    return this.categories.get(id) ?? null;
  }

  async save(category: Category): Promise<Category> {
    this.categories.set(category.id, category);
    return category;
  }

  async delete(id: string): Promise<void> {
    this.categories.delete(id);
  }

  async nextDisplayOrder(restaurantId: string): Promise<number> {
    const existing = await this.findByRestaurant(restaurantId);
    return existing.length === 0 ? 0 : Math.max(...existing.map((c) => c.displayOrder)) + 1;
  }
}

export class FakeMenuItemRepository implements MenuItemRepository {
  private readonly items = new Map<string, MenuItem>();

  seed(item: MenuItem): void {
    this.items.set(item.id, item);
  }

  async findByRestaurant(restaurantId: string): Promise<MenuItem[]> {
    return [...this.items.values()]
      .filter((i) => i.restaurantId === restaurantId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async findByCategory(categoryId: string): Promise<MenuItem[]> {
    return [...this.items.values()]
      .filter((i) => i.categoryId === categoryId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async findById(id: string): Promise<MenuItem | null> {
    return this.items.get(id) ?? null;
  }

  async save(item: MenuItem): Promise<MenuItem> {
    this.items.set(item.id, item);
    return item;
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  async nextDisplayOrder(categoryId: string): Promise<number> {
    const existing = await this.findByCategory(categoryId);
    return existing.length === 0 ? 0 : Math.max(...existing.map((i) => i.displayOrder)) + 1;
  }
}

export class FakeRestaurantRepository implements RestaurantRepository {
  private readonly restaurants = new Map<string, Restaurant>();

  seed(restaurant: Restaurant): void {
    this.restaurants.set(restaurant.id, restaurant);
  }

  async findByOwnerId(ownerId: string): Promise<Restaurant | null> {
    return [...this.restaurants.values()].find((r) => r.ownerId === ownerId) ?? null;
  }

  async findPublished(): Promise<Restaurant | null> {
    return [...this.restaurants.values()].find((r) => r.isPublished) ?? null;
  }

  async save(restaurant: Restaurant): Promise<Restaurant> {
    this.restaurants.set(restaurant.id, restaurant);
    return restaurant;
  }
}

export class FakeTagRepository implements TagRepository {
  private readonly tags = new Map<string, Tag>();
  private readonly menuItemTags = new Map<string, string[]>();

  // Exact-match only, on purpose — see the file header comment.
  async findOrCreateByNames(restaurantId: string, names: string[]): Promise<Tag[]> {
    const uniqueNames = Array.from(new Set(names));
    return uniqueNames.map((name) => {
      const existing = [...this.tags.values()].find((t) => t.restaurantId === restaurantId && t.name === name);
      if (existing) return existing;
      const tag = Tag.create({ id: crypto.randomUUID(), restaurantId, name });
      this.tags.set(tag.id, tag);
      return tag;
    });
  }

  async findByMenuItem(menuItemId: string): Promise<Tag[]> {
    const tagIds = this.menuItemTags.get(menuItemId) ?? [];
    return tagIds.map((id) => this.tags.get(id)).filter((tag): tag is Tag => tag !== undefined);
  }

  async findByMenuItems(menuItemIds: string[]): Promise<Map<string, Tag[]>> {
    const result = new Map<string, Tag[]>();
    for (const id of menuItemIds) {
      result.set(id, await this.findByMenuItem(id));
    }
    return result;
  }

  async replaceMenuItemTags(menuItemId: string, tagIds: string[]): Promise<void> {
    this.menuItemTags.set(menuItemId, tagIds);
  }
}

export class FakeOrderRepository implements OrderRepository {
  readonly placed: PlaceOrderCommand[] = [];
  result: PlacedOrder = {
    orderId: "00000000-0000-4000-8000-0000000000a1",
    placedAt: "2026-09-24T12:00:00.000Z",
    menuSubtotal: 0,
    items: [],
  };
  failWith: Error | null = null;

  async place(command: PlaceOrderCommand): Promise<PlacedOrder> {
    this.placed.push(command);
    if (this.failWith) throw this.failWith;
    return this.result;
  }
}

export class FakeDiningTableRepository implements DiningTableRepository {
  private readonly tables = new Map<string, DiningTable>();
  // Every call that reaches the repository, so tests can assert "never touched".
  readonly calls: string[] = [];
  readonly openedFor: { tableId: string; restaurantId: string }[] = [];

  seed(table: DiningTable): void {
    this.tables.set(table.id, table);
  }

  async findByRestaurant(restaurantId: string): Promise<DiningTable[]> {
    this.calls.push("findByRestaurant");
    return [...this.tables.values()]
      .filter((t) => t.restaurantId === restaurantId)
      .sort((a, b) => a.tableNumber - b.tableNumber);
  }

  async findById(id: string): Promise<DiningTable | null> {
    this.calls.push("findById");
    return this.tables.get(id) ?? null;
  }

  async create(input: { restaurantId: string; tableNumber: number }): Promise<DiningTable> {
    this.calls.push("create");
    const duplicate = [...this.tables.values()].some(
      (t) => t.restaurantId === input.restaurantId && t.tableNumber === input.tableNumber,
    );
    if (duplicate) throw new DuplicateTableNumberError();
    const table = DiningTable.create({
      id: crypto.randomUUID(),
      restaurantId: input.restaurantId,
      tableNumber: input.tableNumber,
      qrToken: crypto.randomUUID().replaceAll("-", ""),
      isOpen: false,
    });
    this.tables.set(table.id, table);
    return table;
  }

  async openSession(input: { tableId: string; restaurantId: string }): Promise<void> {
    this.calls.push("openSession");
    this.openedFor.push(input);
    const table = this.tables.get(input.tableId);
    if (!table) return;
    if (table.isOpen) throw new AlreadyOpenError();
    this.tables.set(table.id, this.withOpen(table, true));
  }

  async closeSession(tableId: string): Promise<void> {
    this.calls.push("closeSession");
    const table = this.tables.get(tableId);
    if (table) this.tables.set(table.id, this.withOpen(table, false));
  }

  private withOpen(table: DiningTable, isOpen: boolean): DiningTable {
    return DiningTable.create({
      id: table.id,
      restaurantId: table.restaurantId,
      tableNumber: table.tableNumber,
      qrToken: table.qrToken,
      isOpen,
    });
  }
}
