"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type TagFilterProps = {
  tags: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

// Multi-select tag filter — OR semantics (an item shows if it has ANY of the
// selected tags). The forgiving default for facet filters: picking a second
// tag broadens results instead of narrowing them to zero.
export function TagFilter({ tags, selected, onChange }: TagFilterProps): React.JSX.Element | null {
  if (tags.length === 0) return null;

  return (
    <ToggleGroup
      type="multiple"
      value={selected}
      onValueChange={onChange}
      aria-label="Filtrar por tag"
      className="flex flex-wrap gap-2"
    >
      {tags.map((tag) => (
        <ToggleGroupItem
          key={tag}
          value={tag}
          className={cn(
            "min-h-11 border border-rule px-3 py-1.5 font-sans text-xs uppercase tracking-wide text-ink-muted",
            "transition-colors hover:border-ink",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
            "data-[state=on]:border-ink data-[state=on]:bg-ink data-[state=on]:text-paper",
          )}
        >
          {tag}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
