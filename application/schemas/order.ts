import { z } from "zod";

// Limits mirror the place_order RPC, which re-checks all of them (it is callable
// with the public anon key); this schema only rejects bad input before the call.
export const placeOrderSchema = z.object({
  tableToken: z.string().min(1).max(64),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
        notes: z.string().trim().max(200).optional(),
      }),
    )
    .min(1)
    .max(30)
    .refine((items) => new Set(items.map((item) => item.menuItemId)).size === items.length, {
      message: "duplicate_items",
    }),
});
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
