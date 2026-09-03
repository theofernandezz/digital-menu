// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MenuCategorySection } from "@/components/organisms/menu-category-section";

const items = [
  { id: "1", name: "Empanadas", description: null, price: 8.5, imageUrl: null, isAvailable: true, tags: [] },
  { id: "2", name: "Milanesa", description: null, price: 14, imageUrl: null, isAvailable: false, tags: [] },
];

describe("MenuCategorySection", () => {
  it("renders the category heading and every item in it", () => {
    render(<MenuCategorySection id="cat-1" name="Starters" description={null} index={0} total={2} items={items} />);
    expect(screen.getByRole("heading", { name: "Starters" })).toBeInTheDocument();
    expect(screen.getByText("Empanadas")).toBeInTheDocument();
    expect(screen.getByText("Milanesa")).toBeInTheDocument();
  });

  it("renders no item rows for an empty category", () => {
    render(<MenuCategorySection id="cat-2" name="Empty" description={null} index={0} total={1} items={[]} />);
    expect(screen.getByRole("heading", { name: "Empty" })).toBeInTheDocument();
    expect(screen.queryByText("Empanadas")).not.toBeInTheDocument();
  });

  it("exposes the category as a scroll anchor for CategoryNav", () => {
    const { container } = render(
      <MenuCategorySection id="cat-1" name="Starters" description={null} index={0} total={2} items={items} />,
    );
    expect(container.querySelector("#category-cat-1")).toBeInTheDocument();
  });
});
