"use server";

import { revalidatePath } from "next/cache";
import { getUseCases } from "@/composition/request-scope";
import { toFormErrors, type FieldErrors } from "@/app/admin/action-helpers";

export type RestaurantFormState = {
  errors?: FieldErrors & { _form?: string[] };
  success?: boolean;
};

export async function updateRestaurantAction(
  _prevState: RestaurantFormState,
  formData: FormData,
): Promise<RestaurantFormState> {
  const { catalog } = await getUseCases();

  try {
    await catalog.updateRestaurant.execute({
      restaurantId: formData.get("restaurantId"),
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description") || null,
      instagram: formData.get("instagram") || null,
      whatsapp: formData.get("whatsapp") || null,
      // Unchecked checkbox sends no key — presence means published.
      isPublished: formData.get("isPublished") !== null,
    });
  } catch (error) {
    return { errors: toFormErrors(error, "No se pudo guardar el restaurante") };
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/");
  return { success: true };
}

// Fire-and-forget, same shape as signOutAction — publishing is the safe
// direction (turns the public menu ON), no confirmation needed. Unpublishing
// is the risky direction and goes through updateRestaurantAction + a confirm
// dialog instead (see publish-toggle.tsx).
export async function publishRestaurantAction(formData: FormData): Promise<void> {
  const { catalog } = await getUseCases();

  await catalog.updateRestaurant.execute({
    restaurantId: formData.get("restaurantId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || null,
    instagram: formData.get("instagram") || null,
    whatsapp: formData.get("whatsapp") || null,
    isPublished: true,
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/");
}
