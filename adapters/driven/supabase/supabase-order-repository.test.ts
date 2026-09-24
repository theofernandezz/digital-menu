// Unit test of the adapter's translation layer: the RPC's error codes and JSON
// keys in, domain errors and domain names out. The client is a stub — no network.
// The real round trip is in __tests__/order-repository.integration.test.ts.
import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseOrderRepository } from "@/adapters/driven/supabase/supabase-order-repository";
import { SupabaseAdapterError } from "@/adapters/driven/supabase/errors";
import {
  InvalidItemsError,
  InvalidTableError,
  ItemsUnavailableError,
  TableClosedError,
  TooManyOpenOrdersError,
} from "@/domain/errors/order-errors";

const ITEM_A = "00000000-0000-4000-8000-0000000000b1";
const COMMAND = { tableToken: "abc", items: [{ menuItemId: ITEM_A, quantity: 2, notes: "no ice" }] };

type RpcOutcome = { data: unknown; error: { code?: string; message: string; details?: string | null } | null };

function repoWhoseRpc(outcome: RpcOutcome | Error): { repo: SupabaseOrderRepository; calls: unknown[][] } {
  const calls: unknown[][] = [];
  const client = {
    rpc: async (...args: unknown[]) => {
      calls.push(args);
      if (outcome instanceof Error) throw outcome;
      return outcome;
    },
  } as unknown as SupabaseClient;
  return { repo: new SupabaseOrderRepository(client), calls };
}

const raised = (message: string, details: string | null = null): RpcOutcome => ({
  data: null,
  error: { code: "P0001", message, details },
});

const rpcOrder = {
  orderId: "00000000-0000-4000-8000-0000000000a9",
  total: 7.5,
  placedAt: "2026-09-24T12:00:00.000+00:00",
  items: [{ name: "Latte", unitPrice: 3.5, quantity: 2, notes: "no ice" }],
};

describe("SupabaseOrderRepository.place", () => {
  it("calls place_order with the token and the lines", async () => {
    const { repo, calls } = repoWhoseRpc({ data: rpcOrder, error: null });

    await repo.place(COMMAND);

    expect(calls).toEqual([["place_order", { p_qr_token: "abc", p_items: COMMAND.items }]]);
  });

  it("translates the RPC's total into menuSubtotal, and only that", async () => {
    const { repo } = repoWhoseRpc({ data: rpcOrder, error: null });

    const order = await repo.place(COMMAND);

    expect(order).toEqual({
      orderId: rpcOrder.orderId,
      placedAt: rpcOrder.placedAt,
      menuSubtotal: 7.5,
      items: rpcOrder.items,
    });
    expect(order).not.toHaveProperty("total");
  });

  it.each([
    ["invalid_table", InvalidTableError],
    ["table_closed", TableClosedError],
    ["too_many_open_orders", TooManyOpenOrdersError],
    ["invalid_items", InvalidItemsError],
  ])("maps the %s RPC error to its domain error", async (message, ErrorClass) => {
    const { repo } = repoWhoseRpc(raised(message));

    await expect(repo.place(COMMAND)).rejects.toBeInstanceOf(ErrorClass);
  });

  it("maps items_unavailable and carries the item ids from the DETAIL json", async () => {
    const { repo } = repoWhoseRpc(raised("items_unavailable", JSON.stringify({ itemIds: [ITEM_A, "x"] })));

    const failure = await repo.place(COMMAND).catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(ItemsUnavailableError);
    expect((failure as ItemsUnavailableError).itemIds).toEqual([ITEM_A, "x"]);
  });

  it.each([
    ["missing", null],
    ["not json", "oops"],
    ["without itemIds", JSON.stringify({ other: 1 })],
  ])("treats items_unavailable with DETAIL %s as an infrastructure failure", async (_label, details) => {
    const { repo } = repoWhoseRpc(raised("items_unavailable", details));

    await expect(repo.place(COMMAND)).rejects.toBeInstanceOf(SupabaseAdapterError);
  });

  it.each([
    ["22P05 (unsupported unicode escape)", { code: "22P05", message: "unsupported Unicode escape sequence", details: null }],
    ["22003 (numeric overflow)", { code: "22003", message: "numeric field overflow", details: null }],
    ["57014 (statement timeout)", { code: "57014", message: "canceling statement due to statement timeout", details: null }],
    ["a known message under another SQLSTATE", { code: "42501", message: "invalid_table", details: null }],
    ["an unknown P0001 message", { code: "P0001", message: "something_new", details: null }],
    ["a fetch failure reported as an error", { message: "TypeError: fetch failed", details: null }],
  ])("turns %s into an adapter error", async (_label, error) => {
    const { repo } = repoWhoseRpc({ data: null, error });

    const failure = await repo.place(COMMAND).catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(SupabaseAdapterError);
    expect(failure).not.toBeInstanceOf(InvalidTableError);
  });

  it("turns a thrown network failure into an adapter error", async () => {
    const { repo } = repoWhoseRpc(new TypeError("fetch failed"));

    await expect(repo.place(COMMAND)).rejects.toBeInstanceOf(SupabaseAdapterError);
  });

  it.each([
    ["null", null],
    ["a missing total", { ...rpcOrder, total: undefined }],
    ["a string total", { ...rpcOrder, total: "7.50" }],
    ["items that are not an array", { ...rpcOrder, items: null }],
    ["a line without a name", { ...rpcOrder, items: [{ unitPrice: 1, quantity: 1, notes: null }] }],
  ])("turns a malformed response (%s) into an adapter error", async (_label, data) => {
    const { repo } = repoWhoseRpc({ data, error: null });

    await expect(repo.place(COMMAND)).rejects.toBeInstanceOf(SupabaseAdapterError);
  });
});
