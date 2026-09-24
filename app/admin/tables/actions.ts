"use server";

import { revalidatePath } from "next/cache";
import { getUseCases } from "@/composition/request-scope";
import { AlreadyOpenError, DuplicateTableNumberError } from "@/domain/errors/table-errors";
import { toFormErrors, type FieldErrors } from "@/app/admin/action-helpers";

export type TableFormState = {
  errors?: FieldErrors & { _form?: string[] };
  success?: boolean;
};

const ALREADY_OPEN_MESSAGE = "La mesa ya está abierta";
const DUPLICATE_TABLE_MESSAGE = "Ya existe una mesa con ese número";

function toTableFormErrors(error: unknown, fallback: string): NonNullable<TableFormState["errors"]> {
  if (error instanceof AlreadyOpenError) return { _form: [ALREADY_OPEN_MESSAGE] };
  if (error instanceof DuplicateTableNumberError) return { _form: [DUPLICATE_TABLE_MESSAGE] };
  return toFormErrors(error, fallback);
}

export async function createTableAction(_prevState: TableFormState, formData: FormData): Promise<TableFormState> {
  const { ordering, catalog } = await getUseCases();

  try {
    const restaurant = await catalog.getMyRestaurant.execute();
    await ordering.createTable.execute({
      restaurantId: restaurant.id,
      tableNumber: formData.get("tableNumber"),
    });
  } catch (error) {
    return { errors: toTableFormErrors(error, "No se pudo crear la mesa") };
  }

  revalidatePath("/admin/tables");
  return { success: true };
}

// Any restaurantId in the form is ignored: the use case takes it from the table.
export async function openTableAction(_prevState: TableFormState, formData: FormData): Promise<TableFormState> {
  const { ordering } = await getUseCases();

  try {
    await ordering.openTable.execute({ id: formData.get("id") });
  } catch (error) {
    // Opened from another tab or device: refresh so this row stops offering "Abrir mesa".
    if (error instanceof AlreadyOpenError) revalidatePath("/admin/tables");
    return { errors: toTableFormErrors(error, "No se pudo abrir la mesa") };
  }

  revalidatePath("/admin/tables");
  return { success: true };
}

export async function closeTableAction(_prevState: TableFormState, formData: FormData): Promise<TableFormState> {
  const { ordering } = await getUseCases();

  try {
    await ordering.closeTable.execute({ id: formData.get("id") });
  } catch (error) {
    return { errors: toTableFormErrors(error, "No se pudo cerrar la mesa") };
  }

  revalidatePath("/admin/tables");
  return { success: true };
}
