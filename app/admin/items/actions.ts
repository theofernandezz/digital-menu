"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/adapters/driven/supabase/client";
import {
  createMenuItemUseCase,
  updateMenuItemUseCase,
  deleteMenuItemUseCase,
  getMyRestaurantUseCase,
  syncMenuItemTagsUseCase,
} from "@/composition/container";
import { toFormErrors, type FieldErrors } from "@/app/admin/action-helpers";

export type MenuItemFormState = {
  errors?: FieldErrors & { _form?: string[] };
  success?: boolean;
};

// Tags are created on-the-fly from this form, not a standalone tags page
// (docs/crud-auth.md) — a plain comma-separated field, synced after the
// item itself is saved (syncMenuItemTagsUseCase needs the item's id).
function parseTagNames(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

export async function createMenuItemAction(
  _prevState: MenuItemFormState,
  formData: FormData,
): Promise<MenuItemFormState> {
  const client = await createServerSupabaseClient();

  try {
    const restaurant = await getMyRestaurantUseCase(client).execute();
    const item = await createMenuItemUseCase(client).execute({
      restaurantId: restaurant.id,
      categoryId: formData.get("categoryId"),
      name: formData.get("name"),
      description: formData.get("description") || null,
      price: formData.get("price"),
      imageUrl: formData.get("imageUrl") || null,
    });
    await syncMenuItemTagsUseCase(client).execute({
      restaurantId: restaurant.id,
      menuItemId: item.id,
      tagNames: parseTagNames(formData.get("tags")),
    });
  } catch (error) {
    return { errors: toFormErrors(error, "No se pudo crear el plato") };
  }

  revalidatePath("/admin/items");
  return { success: true };
}

export async function updateMenuItemAction(
  _prevState: MenuItemFormState,
  formData: FormData,
): Promise<MenuItemFormState> {
  const client = await createServerSupabaseClient();
  const restaurantId = formData.get("restaurantId");

  try {
    const item = await updateMenuItemUseCase(client).execute({
      id: formData.get("id"),
      restaurantId,
      categoryId: formData.get("categoryId"),
      name: formData.get("name"),
      description: formData.get("description") || null,
      price: formData.get("price"),
      imageUrl: formData.get("imageUrl") || null,
      // Unchecked checkboxes send no key at all in FormData — presence, not
      // value, is what means "available" here.
      isAvailable: formData.get("isAvailable") !== null,
    });
    await syncMenuItemTagsUseCase(client).execute({
      restaurantId,
      menuItemId: item.id,
      tagNames: parseTagNames(formData.get("tags")),
    });
  } catch (error) {
    return { errors: toFormErrors(error, "No se pudo guardar el plato") };
  }

  revalidatePath("/admin/items");
  return { success: true };
}

// Fire-and-forget toggle, same shape as signOutAction — no per-field error
// UI needed for a single boolean flip, revalidation alone reflects the
// result. updateMenuItemUseCase replaces the whole entity, so every field
// travels as a hidden input even though only isAvailable changes.
export async function toggleMenuItemAvailabilityAction(formData: FormData): Promise<void> {
  const client = await createServerSupabaseClient();

  await updateMenuItemUseCase(client).execute({
    id: formData.get("id"),
    restaurantId: formData.get("restaurantId"),
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description") || null,
    price: formData.get("price"),
    imageUrl: formData.get("imageUrl") || null,
    isAvailable: formData.get("isAvailable") !== null,
  });

  revalidatePath("/admin/items");
}

export async function deleteMenuItemAction(
  _prevState: MenuItemFormState,
  formData: FormData,
): Promise<MenuItemFormState> {
  const client = await createServerSupabaseClient();

  try {
    await deleteMenuItemUseCase(client).execute({
      id: formData.get("id"),
      restaurantId: formData.get("restaurantId"),
    });
  } catch (error) {
    return { errors: toFormErrors(error, "No se pudo eliminar el plato") };
  }

  revalidatePath("/admin/items");
  return { success: true };
}
