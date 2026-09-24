import type { Category } from "@/domain/entities/category";
import type { DiningTable } from "@/domain/entities/dining-table";
import type { MenuItem } from "@/domain/entities/menu-item";
import type { Restaurant } from "@/domain/entities/restaurant";

// Domain entities are classes with private props — they don't survive the
// RSC → Client Component serialization boundary. Every page maps to plain
// objects here before handing data to a Client Component; this is
// presentation translation (driving-adapter concern), not domain logic.

export type RestaurantViewModel = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  instagram: string | null;
  whatsapp: string | null;
};

export function toRestaurantViewModel(restaurant: Restaurant): RestaurantViewModel {
  return {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    description: restaurant.description,
    isPublished: restaurant.isPublished,
    instagram: restaurant.instagram,
    whatsapp: restaurant.whatsapp,
  };
}

export type CategoryViewModel = {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  displayOrder: number;
};

export function toCategoryViewModel(category: Category): CategoryViewModel {
  return {
    id: category.id,
    restaurantId: category.restaurantId,
    name: category.name,
    description: category.description,
    displayOrder: category.displayOrder,
  };
}

// The QR token never crosses to the client: `link` is built on the server.
export type DiningTableViewModel = {
  id: string;
  tableNumber: number;
  isOpen: boolean;
  link: string;
};

export function toDiningTableViewModel(table: DiningTable, link: string): DiningTableViewModel {
  return {
    id: table.id,
    tableNumber: table.tableNumber,
    isOpen: table.isOpen,
    link,
  };
}

export type MenuItemViewModel = {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  displayOrder: number;
};

export function toMenuItemViewModel(item: MenuItem): MenuItemViewModel {
  return {
    id: item.id,
    restaurantId: item.restaurantId,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
    displayOrder: item.displayOrder,
  };
}
