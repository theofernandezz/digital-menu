// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterableMenu } from "@/components/organisms/filterable-menu";

const categories = [
  {
    id: "cat-1",
    name: "Starters",
    description: null,
    items: [
      { id: "1", name: "Empanadas", description: null, price: 8.5, imageUrl: null, isAvailable: true, tags: ["Vegano"] },
      { id: "2", name: "Milanesa", description: null, price: 14, imageUrl: null, isAvailable: true, tags: ["Picante"] },
    ],
  },
  {
    id: "cat-2",
    name: "Postres",
    description: null,
    items: [
      { id: "3", name: "Flan", description: null, price: 5, imageUrl: null, isAvailable: true, tags: ["Vegano"] },
    ],
  },
];

// Chips start collapsed behind the "Filtros" disclosure — open it first.
async function openFilters(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: /^Filtros/ }));
}

describe("FilterableMenu", () => {
  it("renders every category and item when no filter is applied", () => {
    render(<FilterableMenu categories={categories} />);
    expect(screen.getByText("Empanadas")).toBeInTheDocument();
    expect(screen.getByText("Milanesa")).toBeInTheDocument();
    expect(screen.getByText("Flan")).toBeInTheDocument();
  });

  it("keeps the tag chips collapsed until 'Filtros' is opened", () => {
    render(<FilterableMenu categories={categories} />);
    expect(screen.queryByRole("button", { name: "Vegano" })).not.toBeInTheDocument();
  });

  it("shows how many tags are active on the 'Filtros' toggle even while collapsed", async () => {
    const user = userEvent.setup();
    render(<FilterableMenu categories={categories} />);

    await openFilters(user);
    await user.click(screen.getByRole("button", { name: "Vegano" }));
    await openFilters(user); // collapse again

    expect(screen.getByRole("button", { name: "Filtros (1)" })).toBeInTheDocument();
  });

  it("filters out items and empties categories that don't match the selected tag", async () => {
    const user = userEvent.setup();
    render(<FilterableMenu categories={categories} />);
    await openFilters(user);

    await user.click(screen.getByRole("button", { name: "Vegano" }));

    expect(screen.getByText("Empanadas")).toBeInTheDocument();
    expect(screen.getByText("Flan")).toBeInTheDocument();
    expect(screen.queryByText("Milanesa")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Starters" })).toBeInTheDocument();
  });

  it("matches ANY selected tag (OR), not all of them", async () => {
    const user = userEvent.setup();
    render(<FilterableMenu categories={categories} />);
    await openFilters(user);

    await user.click(screen.getByRole("button", { name: "Vegano" }));
    await user.click(screen.getByRole("button", { name: "Picante" }));

    expect(screen.getByText("Empanadas")).toBeInTheDocument();
    expect(screen.getByText("Milanesa")).toBeInTheDocument();
    expect(screen.getByText("Flan")).toBeInTheDocument();
  });

  it("drops a category entirely once its only matching item is filtered out", async () => {
    const user = userEvent.setup();
    render(<FilterableMenu categories={categories} />);
    await openFilters(user);

    await user.click(screen.getByRole("button", { name: "Picante" }));

    expect(screen.queryByRole("heading", { name: "Postres" })).not.toBeInTheDocument();
  });

  it("un-toggling the only selected tag restores every item", async () => {
    const user = userEvent.setup();
    render(<FilterableMenu categories={categories} />);
    await openFilters(user);

    const veganoToggle = screen.getByRole("button", { name: "Vegano" });
    await user.click(veganoToggle);
    expect(screen.queryByText("Milanesa")).not.toBeInTheDocument();

    await user.click(veganoToggle);
    expect(screen.getByText("Milanesa")).toBeInTheDocument();
  });

  it("also renders a category-nav link per category", () => {
    render(<FilterableMenu categories={categories} />);
    expect(screen.getByRole("link", { name: "Starters" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Postres" })).toBeInTheDocument();
  });
});
