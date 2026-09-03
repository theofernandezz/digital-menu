// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MenuItemRow } from "@/components/molecules/menu-item-row";

describe("MenuItemRow", () => {
  it("shows an 'Agotado' pill when the item is sold out, but still renders it", () => {
    render(<MenuItemRow name="Milanesa" description={null} price={14} isAvailable={false} tags={[]} />);
    expect(screen.getByText("Milanesa")).toBeInTheDocument();
    expect(screen.getByText("Agotado")).toBeInTheDocument();
  });

  it("does not show 'Agotado' when the item is available", () => {
    render(<MenuItemRow name="Milanesa" description={null} price={14} isAvailable={true} tags={[]} />);
    expect(screen.queryByText("Agotado")).not.toBeInTheDocument();
  });

  it("renders each tag as its own pill", () => {
    render(<MenuItemRow name="Empanadas" description={null} price={8.5} isAvailable={true} tags={["Spicy", "Popular"]} />);
    expect(screen.getByText("Spicy")).toBeInTheDocument();
    expect(screen.getByText("Popular")).toBeInTheDocument();
  });

  it("omits the description paragraph when null", () => {
    render(<MenuItemRow name="Empanadas" description={null} price={8.5} isAvailable={true} tags={[]} />);
    expect(screen.queryByText(/beef/i)).not.toBeInTheDocument();
  });
});
