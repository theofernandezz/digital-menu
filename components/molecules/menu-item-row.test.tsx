// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MenuItemRow } from "@/components/molecules/menu-item-row";

describe("MenuItemRow", () => {
  it("shows an 'Agotado' pill when the item is sold out, but still renders it", () => {
    render(
      <MenuItemRow name="Milanesa" description={null} price={14} imageUrl={null} isAvailable={false} tags={[]} />,
    );
    expect(screen.getByText("Milanesa")).toBeInTheDocument();
    expect(screen.getByText("Agotado")).toBeInTheDocument();
  });

  it("does not show 'Agotado' when the item is available", () => {
    render(
      <MenuItemRow name="Milanesa" description={null} price={14} imageUrl={null} isAvailable={true} tags={[]} />,
    );
    expect(screen.queryByText("Agotado")).not.toBeInTheDocument();
  });

  it("renders each tag as its own pill", () => {
    render(
      <MenuItemRow
        name="Empanadas"
        description={null}
        price={8.5}
        imageUrl={null}
        isAvailable={true}
        tags={["Spicy", "Popular"]}
      />,
    );
    expect(screen.getByText("Spicy")).toBeInTheDocument();
    expect(screen.getByText("Popular")).toBeInTheDocument();
  });

  it("omits the description paragraph when null", () => {
    render(
      <MenuItemRow name="Empanadas" description={null} price={8.5} imageUrl={null} isAvailable={true} tags={[]} />,
    );
    expect(screen.queryByText(/beef/i)).not.toBeInTheDocument();
  });

  it("renders the item photo when imageUrl is set", () => {
    const { container } = render(
      <MenuItemRow
        name="Empanadas"
        description={null}
        price={8.5}
        imageUrl="https://example.com/empanadas.jpg"
        isAvailable={true}
        tags={[]}
      />,
    );
    // alt="" is deliberate (redundant with the adjacent name text), which
    // gives the img role "presentation" — query by tag, not role, here.
    expect(container.querySelector("img")).toHaveAttribute("src", "https://example.com/empanadas.jpg");
  });

  it("renders no image when imageUrl is null", () => {
    const { container } = render(
      <MenuItemRow name="Empanadas" description={null} price={8.5} imageUrl={null} isAvailable={true} tags={[]} />,
    );
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("is a static row with no button when there's no photo", () => {
    render(
      <MenuItemRow name="Empanadas" description={null} price={8.5} imageUrl={null} isAvailable={true} tags={[]} />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("opens a detail dialog with the bigger photo when a row with a photo is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MenuItemRow
        name="Empanadas"
        description="Beef, onion, egg"
        price={8.5}
        imageUrl="https://example.com/empanadas.jpg"
        isAvailable={true}
        tags={["Popular"]}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button"));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Empanadas" })).toBeInTheDocument();
    expect(within(dialog).getByText("Beef, onion, egg")).toBeInTheDocument();
  });

  it("closes the detail dialog from its 'Cerrar' button", async () => {
    const user = userEvent.setup();
    render(
      <MenuItemRow
        name="Empanadas"
        description={null}
        price={8.5}
        imageUrl="https://example.com/empanadas.jpg"
        isAvailable={true}
        tags={[]}
      />,
    );

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
