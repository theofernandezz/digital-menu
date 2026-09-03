// Single source of truth for the category anchor DOM id — shared between
// MenuCategorySection (renders it) and CategoryNav (jumps/observes it), so
// the two never drift out of sync.
export function getCategoryAnchorId(categoryId: string): string {
  return `category-${categoryId}`;
}
