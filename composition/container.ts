import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseCategoryRepository } from "@/adapters/driven/supabase/supabase-category-repository";
import { SupabaseMenuItemRepository } from "@/adapters/driven/supabase/supabase-menu-item-repository";
import { SupabaseRestaurantRepository } from "@/adapters/driven/supabase/supabase-restaurant-repository";
import { SupabaseTagRepository } from "@/adapters/driven/supabase/supabase-tag-repository";
import { SupabaseAuthProvider } from "@/adapters/driven/supabase/supabase-auth-provider";
import { CreateCategoryUseCase } from "@/application/use-cases/create-category";
import { ListCategoriesUseCase } from "@/application/use-cases/list-categories";
import { UpdateCategoryUseCase } from "@/application/use-cases/update-category";
import { DeleteCategoryUseCase } from "@/application/use-cases/delete-category";
import { CreateMenuItemUseCase } from "@/application/use-cases/create-menu-item";
import { ListMenuItemsUseCase } from "@/application/use-cases/list-menu-items";
import { UpdateMenuItemUseCase } from "@/application/use-cases/update-menu-item";
import { DeleteMenuItemUseCase } from "@/application/use-cases/delete-menu-item";
import { GetMyRestaurantUseCase } from "@/application/use-cases/get-my-restaurant";
import { UpdateRestaurantUseCase } from "@/application/use-cases/update-restaurant";
import { SyncMenuItemTagsUseCase } from "@/application/use-cases/sync-menu-item-tags";
import { ListMenuItemTagsUseCase } from "@/application/use-cases/list-menu-item-tags";
import { GetPublishedMenuUseCase } from "@/application/use-cases/get-published-menu";
import { SignInUseCase } from "@/application/use-cases/sign-in";
import { SignOutUseCase } from "@/application/use-cases/sign-out";

export function createCategoryUseCase(client: SupabaseClient): CreateCategoryUseCase {
  return new CreateCategoryUseCase(new SupabaseCategoryRepository(client), new SupabaseAuthProvider(client));
}

export function listCategoriesUseCase(client: SupabaseClient): ListCategoriesUseCase {
  return new ListCategoriesUseCase(new SupabaseCategoryRepository(client), new SupabaseAuthProvider(client));
}

export function updateCategoryUseCase(client: SupabaseClient): UpdateCategoryUseCase {
  return new UpdateCategoryUseCase(new SupabaseCategoryRepository(client), new SupabaseAuthProvider(client));
}

export function deleteCategoryUseCase(client: SupabaseClient): DeleteCategoryUseCase {
  return new DeleteCategoryUseCase(new SupabaseCategoryRepository(client), new SupabaseAuthProvider(client));
}

export function createMenuItemUseCase(client: SupabaseClient): CreateMenuItemUseCase {
  return new CreateMenuItemUseCase(
    new SupabaseMenuItemRepository(client),
    new SupabaseCategoryRepository(client),
    new SupabaseAuthProvider(client),
  );
}

export function listMenuItemsUseCase(client: SupabaseClient): ListMenuItemsUseCase {
  return new ListMenuItemsUseCase(new SupabaseMenuItemRepository(client), new SupabaseAuthProvider(client));
}

export function updateMenuItemUseCase(client: SupabaseClient): UpdateMenuItemUseCase {
  return new UpdateMenuItemUseCase(
    new SupabaseMenuItemRepository(client),
    new SupabaseCategoryRepository(client),
    new SupabaseAuthProvider(client),
  );
}

export function deleteMenuItemUseCase(client: SupabaseClient): DeleteMenuItemUseCase {
  return new DeleteMenuItemUseCase(new SupabaseMenuItemRepository(client), new SupabaseAuthProvider(client));
}

export function getMyRestaurantUseCase(client: SupabaseClient): GetMyRestaurantUseCase {
  return new GetMyRestaurantUseCase(new SupabaseRestaurantRepository(client), new SupabaseAuthProvider(client));
}

export function updateRestaurantUseCase(client: SupabaseClient): UpdateRestaurantUseCase {
  return new UpdateRestaurantUseCase(new SupabaseRestaurantRepository(client), new SupabaseAuthProvider(client));
}

export function syncMenuItemTagsUseCase(client: SupabaseClient): SyncMenuItemTagsUseCase {
  return new SyncMenuItemTagsUseCase(
    new SupabaseTagRepository(client),
    new SupabaseMenuItemRepository(client),
    new SupabaseAuthProvider(client),
  );
}

export function listMenuItemTagsUseCase(client: SupabaseClient): ListMenuItemTagsUseCase {
  return new ListMenuItemTagsUseCase(
    new SupabaseTagRepository(client),
    new SupabaseMenuItemRepository(client),
    new SupabaseAuthProvider(client),
  );
}

export function getPublishedMenuUseCase(client: SupabaseClient): GetPublishedMenuUseCase {
  return new GetPublishedMenuUseCase(
    new SupabaseRestaurantRepository(client),
    new SupabaseCategoryRepository(client),
    new SupabaseMenuItemRepository(client),
    new SupabaseTagRepository(client),
  );
}

export function signInUseCase(client: SupabaseClient): SignInUseCase {
  return new SignInUseCase(new SupabaseAuthProvider(client));
}

export function signOutUseCase(client: SupabaseClient): SignOutUseCase {
  return new SignOutUseCase(new SupabaseAuthProvider(client));
}
