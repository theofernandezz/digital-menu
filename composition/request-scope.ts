import { createServerSupabaseClient } from "@/adapters/driven/supabase/client";
import { catalogUseCases, type CatalogUseCases } from "@/composition/catalog";
import { identityUseCases, type IdentityUseCases } from "@/composition/identity";
import { orderingUseCases, type OrderingUseCases } from "@/composition/ordering";

// What app/ (the driving adapter) gets: one object per request, grouped by
// module, all built around a single request-scoped client. app/ never sees
// the client, an adapter, or the SDK — only use cases.
export type UseCases = {
  catalog: CatalogUseCases;
  identity: IdentityUseCases;
  ordering: OrderingUseCases;
};

export async function getUseCases(): Promise<UseCases> {
  const client = await createServerSupabaseClient();

  return {
    catalog: catalogUseCases(client),
    identity: identityUseCases(client),
    ordering: orderingUseCases(client),
  };
}
