import { z } from "zod";
import { MAX_TABLE_NUMBER, MIN_TABLE_NUMBER } from "@/domain/entities/dining-table";

// tableNumber arrives as a form string, hence the coercion. Empty and
// non-numeric input coerce to 0 or NaN and fail the range/integer checks.
export const createTableSchema = z.object({
  restaurantId: z.string().uuid(),
  tableNumber: z.coerce
    .number({ message: "Ingresá un número de mesa" })
    .int({ message: "El número de mesa debe ser entero" })
    .min(MIN_TABLE_NUMBER, { message: `El número de mesa debe estar entre ${MIN_TABLE_NUMBER} y ${MAX_TABLE_NUMBER}` })
    .max(MAX_TABLE_NUMBER, { message: `El número de mesa debe estar entre ${MIN_TABLE_NUMBER} y ${MAX_TABLE_NUMBER}` }),
});
export type CreateTableInput = z.infer<typeof createTableSchema>;

// Open and close take only the table id. Zod strips unknown keys, so a
// restaurantId sent by the caller is dropped here and never trusted.
export const tableIdSchema = z.object({ id: z.string().uuid() });
export type TableIdInput = z.infer<typeof tableIdSchema>;
