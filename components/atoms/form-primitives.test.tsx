// @vitest-environment jsdom
// Input, Label, Textarea, Select, Checkbox, Rule — thin, near-identical
// wrappers (native element + cn() class merge + prop spread), grouped in one
// file rather than five nearly-duplicate ones. Each still gets its own
// assertion that props/className genuinely reach the underlying element —
// this is exactly the kind of thing that silently breaks in a refactor.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Textarea } from "@/components/atoms/textarea";
import { Select } from "@/components/atoms/select";
import { Checkbox } from "@/components/atoms/checkbox";
import { Rule } from "@/components/atoms/rule";

describe("Input", () => {
  it("forwards props and a custom className", () => {
    render(<Input placeholder="Email" className="custom-class" />);
    const input = screen.getByPlaceholderText("Email");
    expect(input).toHaveClass("custom-class");
  });
});

describe("Label", () => {
  it("renders as a <label> associated with its field via htmlFor", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" />
      </>,
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });
});

describe("Textarea", () => {
  it("defaults to 3 rows and forwards a custom rows value", () => {
    const { rerender } = render(<Textarea placeholder="Description" />);
    expect(screen.getByPlaceholderText("Description")).toHaveAttribute("rows", "3");

    rerender(<Textarea placeholder="Description" rows={6} />);
    expect(screen.getByPlaceholderText("Description")).toHaveAttribute("rows", "6");
  });
});

describe("Select", () => {
  it("renders as a combobox with its options", () => {
    render(
      <Select aria-label="Category">
        <option value="starters">Starters</option>
        <option value="mains">Mains</option>
      </Select>,
    );
    expect(screen.getByRole("combobox", { name: "Category" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Mains" })).toBeInTheDocument();
  });
});

describe("Checkbox", () => {
  it("renders as a checkbox input", () => {
    render(<Checkbox aria-label="Published" defaultChecked />);
    expect(screen.getByRole("checkbox", { name: "Published" })).toBeChecked();
  });
});

describe("Rule", () => {
  it("renders as a decorative, screen-reader-hidden divider", () => {
    const { container } = render(<Rule />);
    const hr = container.querySelector("hr");
    expect(hr).toHaveAttribute("aria-hidden", "true");
  });
});
