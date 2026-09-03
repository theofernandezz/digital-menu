// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagFilter } from "@/components/molecules/tag-filter";

describe("TagFilter", () => {
  it("renders nothing when there are no tags to filter by", () => {
    const { container } = render(<TagFilter tags={[]} selected={[]} onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one toggle per tag", () => {
    render(<TagFilter tags={["Vegano", "Picante"]} selected={[]} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Vegano" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Picante" })).toBeInTheDocument();
  });

  it("reports the newly selected tag on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagFilter tags={["Vegano", "Picante"]} selected={[]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Vegano" }));

    expect(onChange).toHaveBeenCalledWith(["Vegano"]);
  });

  it("marks an already-selected tag as pressed", () => {
    render(<TagFilter tags={["Vegano"]} selected={["Vegano"]} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Vegano" })).toHaveAttribute("aria-pressed", "true");
  });
});
