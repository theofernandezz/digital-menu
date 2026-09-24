// Ordering module: customer orders and the dining tables they are placed at.
// Wiring only — no logic lives here.
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAuthProvider } from "@/adapters/driven/supabase/supabase-auth-provider";
import { SupabaseDiningTableRepository } from "@/adapters/driven/supabase/supabase-dining-table-repository";
import { SupabaseOrderRepository } from "@/adapters/driven/supabase/supabase-order-repository";
import { CloseTableUseCase } from "@/application/use-cases/close-table";
import { CreateTableUseCase } from "@/application/use-cases/create-table";
import { ListTablesUseCase } from "@/application/use-cases/list-tables";
import { OpenTableUseCase } from "@/application/use-cases/open-table";
import { PlaceOrderUseCase } from "@/application/use-cases/place-order";

export function placeOrderUseCase(client: SupabaseClient): PlaceOrderUseCase {
  return new PlaceOrderUseCase(new SupabaseOrderRepository(client));
}

export function listTablesUseCase(client: SupabaseClient): ListTablesUseCase {
  return new ListTablesUseCase(new SupabaseDiningTableRepository(client), new SupabaseAuthProvider(client));
}

export function createTableUseCase(client: SupabaseClient): CreateTableUseCase {
  return new CreateTableUseCase(new SupabaseDiningTableRepository(client), new SupabaseAuthProvider(client));
}

export function openTableUseCase(client: SupabaseClient): OpenTableUseCase {
  return new OpenTableUseCase(new SupabaseDiningTableRepository(client), new SupabaseAuthProvider(client));
}

export function closeTableUseCase(client: SupabaseClient): CloseTableUseCase {
  return new CloseTableUseCase(new SupabaseDiningTableRepository(client), new SupabaseAuthProvider(client));
}

// The ordering module's public surface, as seen from app/.
export type OrderingUseCases = {
  placeOrder: PlaceOrderUseCase;
  listTables: ListTablesUseCase;
  createTable: CreateTableUseCase;
  openTable: OpenTableUseCase;
  closeTable: CloseTableUseCase;
};

export function orderingUseCases(client: SupabaseClient): OrderingUseCases {
  return {
    placeOrder: placeOrderUseCase(client),
    listTables: listTablesUseCase(client),
    createTable: createTableUseCase(client),
    openTable: openTableUseCase(client),
    closeTable: closeTableUseCase(client),
  };
}
