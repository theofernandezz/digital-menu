// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryNav } from "@/components/organisms/category-nav";

const categories = [
  { id: "cat-1", name: "Starters" },
  { id: "cat-2", name: "Desserts" },
];

describe("CategoryNav", () => {
  it("renders nothing when there are no categories", () => {
    const { container } = render(<CategoryNav categories={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a nav link per category", () => {
    render(<CategoryNav categories={categories} />);
    expect(screen.getByRole("link", { name: "Starters" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Desserts" })).toBeInTheDocument();
  });

  it("scrolls the matching section into view when a link is clicked", async () => {
    const user = userEvent.setup();
    // jsdom implements neither of these.
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    document.body.innerHTML += '<section id="category-cat-2"></section>';

    render(<CategoryNav categories={categories} />);
    await user.click(screen.getByRole("link", { name: "Desserts" }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("scrolls instantly when the user prefers reduced motion", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    document.body.innerHTML += '<section id="category-cat-1"></section>';

    render(<CategoryNav categories={categories} />);
    await user.click(screen.getByRole("link", { name: "Starters" }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });

  it("scrolls the active link into view inside the nav rail once its section becomes active", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    document.body.innerHTML += '<section id="category-cat-1"></section><section id="category-cat-2"></section>';

    let observerCallback: IntersectionObserverCallback | null = null;
    class FakeIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }
      observe(): void {}
      disconnect(): void {}
    }
    window.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;

    render(<CategoryNav categories={categories} />);
    const dessertsSection = document.getElementById("category-cat-2")!;

    // Simulate the "Desserts" section scrolling into the observed band —
    // this is what mobile scrolling triggers, not a click.
    act(() => {
      observerCallback!(
        [{ isIntersecting: true, target: dessertsSection } as unknown as IntersectionObserverEntry],
        null as never,
      );
    });

    const dessertsLink = screen.getByRole("link", { name: "Desserts" });
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", inline: "nearest", block: "nearest" });
    expect(scrollIntoView.mock.instances[0]).toBe(dessertsLink);
  });
});
