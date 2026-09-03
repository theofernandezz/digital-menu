// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PublicMenuTemplate } from "@/components/templates/public-menu-template";
import type { PublishedMenu } from "@/application/use-cases/get-published-menu";

const menu: PublishedMenu = {
  restaurantName: "Demo Restaurant",
  restaurantDescription: null,
  restaurantInstagram: null,
  restaurantWhatsapp: null,
  categories: [
    {
      id: "cat-1",
      name: "Starters",
      description: null,
      items: [{ id: "item-1", name: "Empanadas", description: null, price: 8.5, imageUrl: null, isAvailable: true, tags: [] }],
    },
  ],
};

describe("PublicMenuTemplate", () => {
  it("renders the restaurant name, categories, and their items", () => {
    render(<PublicMenuTemplate menu={menu} />);
    expect(screen.getByRole("heading", { name: "Demo Restaurant", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Starters" })).toBeInTheDocument();
    expect(screen.getByText("Empanadas")).toBeInTheDocument();
  });

  it("shows an empty-menu message when there are no categories yet", () => {
    render(<PublicMenuTemplate menu={{ ...menu, categories: [] }} />);
    expect(screen.getByText(/todavía no tiene categorías/i)).toBeInTheDocument();
  });

  it("exposes a skip-link target via id=\"main-content\"", () => {
    const { container } = render(<PublicMenuTemplate menu={menu} />);
    expect(container.querySelector("#main-content")).toBeInTheDocument();
  });
});
