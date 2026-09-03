// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TagPill } from "@/components/atoms/tag-pill";

describe("TagPill", () => {
  it("renders its children", () => {
    render(<TagPill>Vegan</TagPill>);
    expect(screen.getByText("Vegan")).toBeInTheDocument();
  });
});
