import type { RestaurantRepository } from "@/application/ports/restaurant-repository";
import type { CategoryRepository } from "@/application/ports/category-repository";
import type { MenuItemRepository } from "@/application/ports/menu-item-repository";
import type { TagRepository } from "@/application/ports/tag-repository";

export type PublishedMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  // Does NOT gate visibility — "sold out" UI state only, still shows to the
  // public. See structure.sql / docs/build-plan.md.
  isAvailable: boolean;
  tags: string[];
};

export type PublishedMenuCategory = {
  id: string;
  name: string;
  description: string | null;
  items: PublishedMenuItem[];
};

export type PublishedMenu = {
  restaurantName: string;
  restaurantDescription: string | null;
  categories: PublishedMenuCategory[];
};

// No input, no auth — public read. Single-tenant v1: there's exactly one
// published restaurant to show, no slug needed yet (docs/build-plan.md).
export class GetPublishedMenuUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly categoryRepo: CategoryRepository,
    private readonly menuItemRepo: MenuItemRepository,
    private readonly tagRepo: TagRepository,
  ) {}

  async execute(): Promise<PublishedMenu | null> {
    const restaurant = await this.restaurantRepo.findPublished();
    if (!restaurant) return null;

    // Both already ordered by display_order by their repositories — grouping
    // items into their category below preserves that order at both levels,
    // no re-sorting needed.
    const [categories, items] = await Promise.all([
      this.categoryRepo.findByRestaurant(restaurant.id),
      this.menuItemRepo.findByRestaurant(restaurant.id),
    ]);

    // One bulk query instead of one per item.
    const tagsByItemId = await this.tagRepo.findByMenuItems(items.map((item) => item.id));

    const itemsByCategoryId = new Map<string, PublishedMenuItem[]>();
    for (const item of items) {
      const list = itemsByCategoryId.get(item.categoryId) ?? [];
      list.push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
        tags: (tagsByItemId.get(item.id) ?? []).map((tag) => tag.name),
      });
      itemsByCategoryId.set(item.categoryId, list);
    }

    return {
      restaurantName: restaurant.name,
      restaurantDescription: restaurant.description,
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        items: itemsByCategoryId.get(category.id) ?? [],
      })),
    };
  }
}
