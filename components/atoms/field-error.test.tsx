// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldError } from "@/components/atoms/field-error";

describe("FieldError", () => {
  it("renders the message with an alert role when present", () => {
    render(<FieldError id="email-error" message="Invalid email" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email");
  });

  it("renders nothing when there's no message", () => {
    const { container } = render(<FieldError id="email-error" message={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});
