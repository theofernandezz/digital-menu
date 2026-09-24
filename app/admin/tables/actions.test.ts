import { afterEach, describe, expect, it, vi } from "vitest";
import { closeTableAction, createTableAction, openTableAction } from "@/app/admin/tables/actions";
import { CloseTableUseCase } from "@/application/use-cases/close-table";
import { CreateTableUseCase } from "@/application/use-cases/create-table";
import { OpenTableUseCase } from "@/application/use-cases/open-table";
import { DiningTable } from "@/domain/entities/dining-table";
import {
  FakeAuthProvider,
  FakeDiningTableRepository,
  FAKE_RESTAURANT_ID,
} from "@/application/__tests__/fakes";

const getUseCases = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("@/composition/request-scope", () => ({ getUseCases }));
vi.mock("next/cache", () => ({ revalidatePath }));

const TABLE_ID = "11111111-1111-4111-8111-111111111111";

function setup(options: { seedOpen?: boolean } = {}) {
  const repo = new FakeDiningTableRepository();
  if (options.seedOpen !== undefined) {
    repo.seed(
      DiningTable.create({
        id: TABLE_ID,
        restaurantId: FAKE_RESTAURANT_ID,
        tableNumber: 3,
        qrToken: "t",
        isOpen: options.seedOpen,
      }),
    );
  }
  const auth = new FakeAuthProvider();
  getUseCases.mockResolvedValue({
    catalog: { getMyRestaurant: { execute: async () => ({ id: FAKE_RESTAURANT_ID }) } },
    ordering: {
      createTable: new CreateTableUseCase(repo, auth),
      openTable: new OpenTableUseCase(repo, auth),
      closeTable: new CloseTableUseCase(repo, auth),
    },
  });
  return { repo, auth };
}

const form = (fields: Record<string, string>): FormData => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

afterEach(() => {
  getUseCases.mockReset();
  revalidatePath.mockReset();
  vi.restoreAllMocks();
});

describe("createTableAction", () => {
  it("creates the table and revalidates the page", async () => {
    const { repo } = setup();
    const result = await createTableAction({}, form({ tableNumber: "12" }));

    expect(result).toEqual({ success: true });
    expect((await repo.findByRestaurant(FAKE_RESTAURANT_ID)).map((t) => t.tableNumber)).toEqual([12]);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/tables");
  });

  it("returns the field error for an invalid number, without revalidating", async () => {
    setup();
    const result = await createTableAction({}, form({ tableNumber: "1000" }));

    expect(result.success).toBeUndefined();
    expect(result.errors?.tableNumber?.[0]).toMatch(/entre 1 y 999/);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns the duplicate message", async () => {
    setup();
    await createTableAction({}, form({ tableNumber: "4" }));
    const result = await createTableAction({}, form({ tableNumber: "4" }));

    expect(result).toEqual({ errors: { _form: ["Ya existe una mesa con ese número"] } });
  });

  it("turns an unknown error into one generic message, logs it and leaks nothing", async () => {
    const { repo } = setup();
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    repo.create = async () => {
      throw new Error("connection refused 10.0.0.5:5432");
    };

    const result = await createTableAction({}, form({ tableNumber: "5" }));

    expect(result).toEqual({ errors: { _form: ["No se pudo crear la mesa"] } });
    expect(JSON.stringify(result)).not.toContain("10.0.0.5");
    expect(logged).toHaveBeenCalledOnce();
  });
});

describe("openTableAction", () => {
  it("opens the table", async () => {
    const { repo } = setup({ seedOpen: false });
    const result = await openTableAction({}, form({ id: TABLE_ID }));

    expect(result).toEqual({ success: true });
    expect((await repo.findById(TABLE_ID))?.isOpen).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/tables");
  });

  it("returns the already-open message", async () => {
    setup({ seedOpen: true });
    const result = await openTableAction({}, form({ id: TABLE_ID }));

    expect(result).toEqual({ errors: { _form: ["La mesa ya está abierta"] } });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/tables");
  });

  it("turns an unknown error into one generic message and logs it", async () => {
    const { repo } = setup({ seedOpen: false });
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    repo.openSession = async () => {
      throw new Error("secret internals");
    };

    const result = await openTableAction({}, form({ id: TABLE_ID }));

    expect(result).toEqual({ errors: { _form: ["No se pudo abrir la mesa"] } });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalledOnce();
  });
});

describe("closeTableAction", () => {
  it("closes the table", async () => {
    const { repo } = setup({ seedOpen: true });
    const result = await closeTableAction({}, form({ id: TABLE_ID }));

    expect(result).toEqual({ success: true });
    expect((await repo.findById(TABLE_ID))?.isOpen).toBe(false);
  });

  it("turns an unauthenticated call into the generic message and logs it", async () => {
    const { auth } = setup({ seedOpen: true });
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    auth.currentUserId = null;

    const result = await closeTableAction({}, form({ id: TABLE_ID }));

    expect(result).toEqual({ errors: { _form: ["No se pudo cerrar la mesa"] } });
    expect(logged).toHaveBeenCalledOnce();
  });

  it("turns an unknown error into one generic message and logs it", async () => {
    const { repo } = setup({ seedOpen: true });
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    repo.closeSession = async () => {
      throw new Error("secret internals");
    };

    const result = await closeTableAction({}, form({ id: TABLE_ID }));

    expect(result).toEqual({ errors: { _form: ["No se pudo cerrar la mesa"] } });
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(logged).toHaveBeenCalledOnce();
  });
});
