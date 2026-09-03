// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MenuHeader } from "@/components/organisms/menu-header";

describe("MenuHeader", () => {
  it("renders the restaurant name as the main heading", () => {
    render(<MenuHeader name="Demo Restaurant" description={null} instagram={null} whatsapp={null} />);
    expect(screen.getByRole("heading", { name: "Demo Restaurant", level: 1 })).toBeInTheDocument();
  });

  it("omits the description paragraph when null (the 'Carta' label paragraph still renders)", () => {
    const { container } = render(
      <MenuHeader name="Demo Restaurant" description={null} instagram={null} whatsapp={null} />,
    );
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("renders the description when present", () => {
    render(<MenuHeader name="Demo Restaurant" description="Comida casera" instagram={null} whatsapp={null} />);
    expect(screen.getByText("Comida casera")).toBeInTheDocument();
  });

  it("omits the social links row when neither is set", () => {
    render(<MenuHeader name="Demo Restaurant" description={null} instagram={null} whatsapp={null} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("links to instagram.com when given a bare handle", () => {
    render(<MenuHeader name="Demo Restaurant" description={null} instagram="@demo" whatsapp={null} />);
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://instagram.com/demo");
  });

  it("links to wa.me with only the digits when given a formatted phone number", () => {
    render(<MenuHeader name="Demo Restaurant" description={null} instagram={null} whatsapp="+54 9 11 1234-5678" />);
    expect(screen.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", "https://wa.me/5491112345678");
  });
});
