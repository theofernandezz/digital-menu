// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Price } from "@/components/atoms/price";

describe("Price", () => {
  it("formats a value as ARS currency", () => {
    render(<Price value={12} />);
    // Non-breaking space between the symbol and the number is locale-correct
    // for es-AR — normalize whitespace instead of matching it literally.
    expect(screen.getByText(/\$\s?12/)).toBeInTheDocument();
  });

  it("keeps up to 2 decimal places for non-integer prices", () => {
    render(<Price value={19.99} />);
    expect(screen.getByText(/19,99|19\.99/)).toBeInTheDocument();
  });
});
