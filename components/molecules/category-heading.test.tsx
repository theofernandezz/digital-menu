// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryHeading } from "@/components/molecules/category-heading";

describe("CategoryHeading", () => {
  it("renders the name and a zero-padded index/total counter", () => {
    render(<CategoryHeading name="Starters" description={null} index={0} total={3} />);
    expect(screen.getByRole("heading", { name: "Starters" })).toBeInTheDocument();
    expect(screen.getByText("01 / 03")).toBeInTheDocument();
  });

  it("renders the description when present, omits it when null", () => {
    const { rerender } = render(<CategoryHeading name="Starters" description="To share" index={0} total={1} />);
    expect(screen.getByText("To share")).toBeInTheDocument();

    rerender(<CategoryHeading name="Starters" description={null} index={0} total={1} />);
    expect(screen.queryByText("To share")).not.toBeInTheDocument();
  });
});
