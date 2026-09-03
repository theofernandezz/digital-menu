// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MenuHeader } from "@/components/organisms/menu-header";

describe("MenuHeader", () => {
  it("renders the restaurant name as the main heading", () => {
    render(<MenuHeader name="Demo Restaurant" description={null} />);
    expect(screen.getByRole("heading", { name: "Demo Restaurant", level: 1 })).toBeInTheDocument();
  });

  it("omits the description paragraph when null (the 'Carta' label paragraph still renders)", () => {
    const { container } = render(<MenuHeader name="Demo Restaurant" description={null} />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("renders the description when present", () => {
    render(<MenuHeader name="Demo Restaurant" description="Comida casera" />);
    expect(screen.getByText("Comida casera")).toBeInTheDocument();
  });
});
