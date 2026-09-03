"use client";

import { useMemo, useState } from "react";
import { ScrollReveal } from "@/components/atoms/scroll-reveal";
import { TagFilter } from "@/components/molecules/tag-filter";
import { CategoryNav } from "@/components/organisms/category-nav";
import { MenuCategorySection } from "@/components/organisms/menu-category-section";
import { cn } from "@/lib/utils";

type FilterableMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  tags: string[];
};

type FilterableMenuCategory = {
  id: string;
  name: string;
  description: string | null;
  items: FilterableMenuItem[];
};

type FilterableMenuProps = {
  categories: FilterableMenuCategory[];
};

// Client-side: the tag filter and category nav both need interactive state,
// so this organism owns them and renders the (otherwise presentational)
// MenuCategorySection list.
export function FilterableMenu({ categories }: FilterableMenuProps): React.JSX.Element {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // First-seen order — stable across renders, matches how tags already read
  // in each item row.
  const allTags = useMemo(() => {
    const seen: string[] = [];
    for (const category of categories) {
      for (const item of category.items) {
        for (const tag of item.tags) {
          if (!seen.includes(tag)) seen.push(tag);
        }
      }
    }
    return seen;
  }, [categories]);

  // OR semantics — see TagFilter. A selected tag always has at least one
  // matching item (it came from `allTags`, derived from these same items),
  // so this can drop categories to empty but never leave zero results
  // overall — no "no matches" state needed.
  const filteredCategories = useMemo(() => {
    if (selectedTags.length === 0) return categories;
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => item.tags.some((tag) => selectedTags.includes(tag))),
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, selectedTags]);

  return (
    <div>
      <CategoryNav categories={filteredCategories} />

      {allTags.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setIsFilterOpen((open) => !open)}
            aria-expanded={isFilterOpen}
            aria-controls="tag-filter-panel"
            className="flex min-h-11 items-center gap-1.5 font-sans text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Filtros{selectedTags.length > 0 && ` (${selectedTags.length})`}
            <svg
              viewBox="0 0 12 8"
              aria-hidden="true"
              className={cn("size-3 transition-transform", isFilterOpen && "rotate-180")}
            >
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </button>
          {isFilterOpen && (
            <div id="tag-filter-panel" className="mt-3">
              <TagFilter tags={allTags} selected={selectedTags} onChange={setSelectedTags} />
            </div>
          )}
        </div>
      )}

      <div className="mt-10 space-y-16">
        {filteredCategories.map((category, index) => (
          <ScrollReveal key={category.id}>
            <MenuCategorySection
              id={category.id}
              name={category.name}
              description={category.description}
              index={index}
              total={filteredCategories.length}
              items={category.items}
            />
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
