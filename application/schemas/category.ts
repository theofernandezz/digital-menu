import { z } from "zod";

// Shared by the create and update use cases — this project requires the same
// fields on both (docs/crud-auth.md), so there's no .pick()/.partial() variant.
// Lives here, not in either use case, so neither depends on the other.
export const categorySchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().nullable().optional(),
});
export type CategoryInput = z.infer<typeof categorySchema>;
