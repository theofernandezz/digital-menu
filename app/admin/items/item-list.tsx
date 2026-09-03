import type { CategoryViewModel, MenuItemViewModel } from "@/app/admin/view-models";
import { AvailabilityToggleForm } from "@/app/admin/items/availability-toggle-form";
import { DeleteMenuItemDialog } from "@/app/admin/items/delete-item-dialog";
import { EditMenuItemDialog } from "@/app/admin/items/edit-item-dialog";
import { Price } from "@/components/atoms/price";
import { Rule } from "@/components/atoms/rule";
import { TagPill } from "@/components/atoms/tag-pill";

export type MenuItemRow = MenuItemViewModel & { tags: string[] };

type MenuItemListProps = {
  items: MenuItemRow[];
  categories: CategoryViewModel[];
};

export function MenuItemList({ items, categories }: MenuItemListProps): React.JSX.Element {
  if (items.length === 0) {
    return <p className="mt-8 font-sans text-ink-muted">Todavía no hay platos. Creá el primero arriba.</p>;
  }

  const itemsByCategory = new Map<string, MenuItemRow[]>();
  for (const item of items) {
    const group = itemsByCategory.get(item.categoryId) ?? [];
    group.push(item);
    itemsByCategory.set(item.categoryId, group);
  }

  return (
    <div className="mt-8 space-y-10">
      {categories
        .filter((category) => itemsByCategory.has(category.id))
        .map((category) => (
          <section key={category.id}>
            <h2 className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">
              {category.name}
            </h2>
            <ul className="mt-3">
              {itemsByCategory.get(category.id)!.map((item, index) => (
                <li key={item.id}>
                  {index > 0 && <Rule />}
                  <div className="flex flex-col gap-3 py-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-sans text-base font-medium text-ink">{item.name}</p>
                        {!item.isAvailable && <TagPill>Agotado</TagPill>}
                        {item.tags.map((tag) => (
                          <TagPill key={tag}>{tag}</TagPill>
                        ))}
                      </div>
                      {item.description && (
                        <p className="mt-0.5 max-w-md font-sans text-sm text-ink-muted">{item.description}</p>
                      )}
                      <Price value={item.price} className="mt-1 block" />
                    </div>
                    {/* Always its own row below, regardless of how short/long the
                        info above is — flex-wrap on a single row let the buttons
                        land beside short content and below long content,
                        inconsistently from item to item. */}
                    <div className="flex flex-wrap items-center gap-3">
                      <AvailabilityToggleForm item={item} />
                      <EditMenuItemDialog item={item} categories={categories} tags={item.tags} />
                      <DeleteMenuItemDialog item={item} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
