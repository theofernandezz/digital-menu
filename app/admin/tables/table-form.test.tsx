// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { createTableAction } from "@/app/admin/tables/actions";
import { TableForm } from "@/app/admin/tables/table-form";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/app/admin/tables/actions", () => ({ createTableAction: vi.fn() }));

describe("TableForm", () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.restoreAllMocks();
  });

  // Regression: the effect used to depend on `state.success`, which stays `true`
  // between two successful creates, so only the first one toasted.
  it("toasts 'Mesa creada' on every successful create, not only the first", async () => {
    const user = userEvent.setup();
    vi.mocked(createTableAction).mockImplementation(async () => ({ success: true }));
    render(<TableForm />);

    await user.type(screen.getByLabelText("Número de mesa"), "10");
    await user.click(screen.getByRole("button", { name: "Crear mesa" }));
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("button", { name: "Crear mesa" })).toBeEnabled();

    expect(screen.getByLabelText("Número de mesa")).toHaveValue(null); // form was reset after success
    // user-event tracks its own input value and does not see the programmatic reset.
    await user.clear(screen.getByLabelText("Número de mesa"));
    await user.type(screen.getByLabelText("Número de mesa"), "11");
    await user.click(screen.getByRole("button", { name: "Crear mesa" }));
    await vi.waitFor(() => expect(createTableAction).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledTimes(2));

    expect(toast.success).toHaveBeenNthCalledWith(1, "Mesa creada");
    expect(toast.success).toHaveBeenNthCalledWith(2, "Mesa creada");
  });

  it("shows the form error in the alert and does not toast success", async () => {
    const user = userEvent.setup();
    vi.mocked(createTableAction).mockResolvedValue({ errors: { _form: ["Ya existe una mesa con ese número"] } });
    render(<TableForm />);

    await user.type(screen.getByLabelText("Número de mesa"), "10");
    await user.click(screen.getByRole("button", { name: "Crear mesa" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe una mesa con ese número");
    expect(toast.success).not.toHaveBeenCalled();
  });
});
