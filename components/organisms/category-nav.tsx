"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getCategoryAnchorId } from "@/lib/menu-anchors";

type CategoryNavProps = {
  categories: { id: string; name: string }[];
};

// Sticky jump-nav for long menus. One IntersectionObserver watches every
// category section at once; whichever is topmost among the currently
// intersecting ones is "active". Falls back to no highlight (still fully
// navigable via click) if IntersectionObserver isn't available.
export function CategoryNav({ categories }: CategoryNavProps): React.JSX.Element | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const sections = categories
      .map((category) => document.getElementById(getCategoryAnchorId(category.id)))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }
        // Topmost visible section, by DOM order.
        const topmost = sections.find((section) => visible.has(section.id));
        if (topmost) setActiveId(topmost.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [categories]);

  // Keeps the active link in view inside the horizontal-scroll rail (mobile:
  // with enough categories, later ones start out scrolled past the edge —
  // the underline was updating correctly, just off-screen where nobody
  // could see it). `block: "nearest"` keeps this from also scrolling the
  // page vertically.
  useEffect(() => {
    if (!activeId || !navRef.current) return;
    const activeLink = navRef.current.querySelector(`[data-category-anchor="${activeId}"]`);
    if (!(activeLink instanceof HTMLElement)) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    activeLink.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", inline: "nearest", block: "nearest" });
  }, [activeId]);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>, categoryId: string): void {
    event.preventDefault();
    const target = document.getElementById(getCategoryAnchorId(categoryId));
    if (!target) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }

  if (categories.length === 0) return null;

  return (
    <nav
      ref={navRef}
      aria-label="Categorías"
      className="sticky top-0 z-10 -mx-6 flex gap-5 overflow-x-auto border-b border-rule bg-paper/95 px-6 py-3 backdrop-blur-sm sm:-mx-10 sm:px-10"
    >
      {categories.map((category) => (
        <a
          key={category.id}
          href={`#${getCategoryAnchorId(category.id)}`}
          onClick={(event) => handleClick(event, category.id)}
          data-category-anchor={getCategoryAnchorId(category.id)}
          className={cn(
            "shrink-0 font-sans text-sm whitespace-nowrap transition-colors",
            activeId === getCategoryAnchorId(category.id) ? "text-ink underline underline-offset-4" : "text-ink-muted hover:text-ink",
          )}
        >
          {category.name}
        </a>
      ))}
    </nav>
  );
}
