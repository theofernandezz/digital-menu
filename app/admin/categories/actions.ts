"use server";

import { revalidatePath } from "next/cache";
import { getUseCases } from "@/composition/request-scope";
import { toFormErrors, type FieldErrors } from "@/app/admin/action-helpers";

export type CategoryFormState = {
  errors?: FieldErrors & { _form?: string[] };
  success?: boolean;
};

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const { catalog } = await getUseCases();

  try {
    const restaurant = await catalog.getMyRestaurant.execute();
    await catalog.createCategory.execute({
      restaurantId: restaurant.id,
      name: formData.get("name"),
      description: formData.get("description") || null,
    });
  } catch (error) {
    return { errors: toFormErrors(error, "No se pudo crear la categoría") };
  }

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function updateCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const { catalog } = await getUseCases();

  try {
    await catalog.updateCategory.execute({
      id: formData.get("id"),
      restaurantId: formData.get("restaurantId"),
      name: formData.get("name"),
      description: formData.get("description") || null,
    });
  } catch (error) {
    return { errors: toFormErrors(error, "No se pudo guardar la categoría") };
  }

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const { catalog } = await getUseCases();

  try {
    await catalog.deleteCategory.execute({
      id: formData.get("id"),
      restaurantId: formData.get("restaurantId"),
    });
  } catch (error) {
    return { errors: toFormErrors(error, "No se pudo eliminar la categoría") };
  }

  revalidatePath("/admin/categories");
  return { success: true };
}
