// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TableList } from "@/app/admin/tables/table-list";

vi.mock("@/app/admin/tables/actions", () => ({
  openTableAction: vi.fn(),
  closeTableAction: vi.fn(),
}));

describe("TableList", () => {
  it("shows the empty state when there are no tables", () => {
    render(<TableList tables={[]} />);
    expect(screen.getByText("Todavía no hay mesas. Creá la primera arriba.")).toBeInTheDocument();
  });

  it("renders an open table with its close button and a closed table with its open button", () => {
    render(
      <TableList
        tables={[
          { id: "a", tableNumber: 3, isOpen: true, link: "http://localhost:3000/t/tok-3" },
          { id: "b", tableNumber: 4, isOpen: false, link: "http://localhost:3000/t/tok-4" },
        ]}
      />,
    );
    const [open, closed] = screen.getAllByRole("listitem");

    expect(within(open).getByText("Mesa 3")).toBeInTheDocument();
    expect(within(open).getByText("Abierta")).toBeInTheDocument();
    expect(within(open).getByRole("button", { name: "Cerrar mesa 3" })).toBeInTheDocument();

    expect(within(closed).getByText("Mesa 4")).toBeInTheDocument();
    expect(within(closed).getByText("Cerrada")).toBeInTheDocument();
    expect(within(closed).getByRole("button", { name: "Abrir mesa 4" })).toBeInTheDocument();
  });

  it("renders each link with its URL as href and text, opening in a new tab", () => {
    render(
      <TableList
        tables={[
          { id: "a", tableNumber: 3, isOpen: true, link: "http://localhost:3000/t/tok-3" },
          { id: "b", tableNumber: 4, isOpen: false, link: "https://menu.example.com/t/tok-4" },
        ]}
      />,
    );

    for (const url of ["http://localhost:3000/t/tok-3", "https://menu.example.com/t/tok-4"]) {
      const link = screen.getByRole("link", { name: url });
      expect(link).toHaveAttribute("href", url);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
    }
  });
});
