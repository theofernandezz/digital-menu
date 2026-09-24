import type { SupabaseClient } from "@supabase/supabase-js";
import { DiningTable } from "@/domain/entities/dining-table";
import { AlreadyOpenError, DuplicateTableNumberError } from "@/domain/errors/table-errors";
import type { DiningTableRepository } from "@/application/ports/dining-table-repository";
import { SupabaseAdapterError } from "@/adapters/driven/supabase/errors";

const PG_UNIQUE_VIOLATION = "23505";

// TODO: hand-written row type until `supabase gen types typescript` is wired up.
// `table_sessions` holds only the OPEN sessions (the query filters closed_at is null).
type DiningTableRow = {
  id: string;
  restaurant_id: string;
  table_number: number;
  qr_token: string;
  table_sessions?: { id: string }[];
};

const TABLE_COLUMNS = "id, restaurant_id, table_number, qr_token";

function toEntity(row: DiningTableRow): DiningTable {
  return DiningTable.create({
    id: row.id,
    restaurantId: row.restaurant_id,
    tableNumber: row.table_number,
    qrToken: row.qr_token,
    isOpen: (row.table_sessions?.length ?? 0) > 0,
  });
}

export class SupabaseDiningTableRepository implements DiningTableRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByRestaurant(restaurantId: string): Promise<DiningTable[]> {
    const { data, error } = await this.client
      .from("dining_tables")
      .select(`${TABLE_COLUMNS}, table_sessions(id)`)
      .eq("restaurant_id", restaurantId)
      .is("table_sessions.closed_at", null)
      .order("table_number", { ascending: true });

    if (error) throw new SupabaseAdapterError("Failed to list tables", error);
    return (data as DiningTableRow[]).map(toEntity);
  }

  async findById(id: string): Promise<DiningTable | null> {
    const { data, error } = await this.client
      .from("dining_tables")
      .select(`${TABLE_COLUMNS}, table_sessions(id)`)
      .eq("id", id)
      .is("table_sessions.closed_at", null)
      .maybeSingle();

    if (error) throw new SupabaseAdapterError("Failed to fetch table", error);
    return data ? toEntity(data as DiningTableRow) : null;
  }

  async create(input: { restaurantId: string; tableNumber: number }): Promise<DiningTable> {
    const { data, error } = await this.client
      .from("dining_tables")
      .insert({ restaurant_id: input.restaurantId, table_number: input.tableNumber })
      .select(TABLE_COLUMNS)
      .single();

    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) throw new DuplicateTableNumberError();
      throw new SupabaseAdapterError("Failed to create table", error);
    }
    return toEntity(data as DiningTableRow);
  }

  async openSession(input: { tableId: string; restaurantId: string }): Promise<void> {
    const { error } = await this.client
      .from("table_sessions")
      .insert({ restaurant_id: input.restaurantId, dining_table_id: input.tableId });

    if (error) {
      // one_open_session_per_table: race-safe, the database decides.
      if (error.code === PG_UNIQUE_VIOLATION) throw new AlreadyOpenError();
      throw new SupabaseAdapterError("Failed to open table", error);
    }
  }

  async closeSession(tableId: string): Promise<void> {
    const { error } = await this.client
      .from("table_sessions")
      .update({ closed_at: new Date().toISOString() })
      .eq("dining_table_id", tableId)
      .is("closed_at", null);

    if (error) throw new SupabaseAdapterError("Failed to close table", error);
  }
}
