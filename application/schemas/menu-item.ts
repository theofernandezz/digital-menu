import { z } from "zod";

// numeric(10,2) in supabase/migrations — z.coerce.number() per project convention
// (FormData gives strings), with a float-drift-tolerant 2-decimal check
// instead of .multipleOf(0.01), which false-rejects values like 19.99
// (19.99 * 100 !== 1999 exactly in IEEE 754).
function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(Math.round(value * 100) - value * 100) < 1e-6;
}

// Shared by the create and update use cases — same fields required on both
// (docs/crud-auth.md). Lives here, not in either use case, so neither depends
// on the other.
export const menuItemSchema = z.object({
  restaurantId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(150).trim(),
  description: z.string().max(1000).trim().nullable().optional(),
  price: z.coerce.number().nonnegative().refine(hasAtMostTwoDecimals, "Price must have at most 2 decimal places"),
  imageUrl: z.string().url().nullable().optional(),
});
export type MenuItemInput = z.infer<typeof menuItemSchema>;
