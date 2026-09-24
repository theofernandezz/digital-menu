import Link from "next/link";
import { getMyRestaurant } from "@/app/admin/get-restaurant";
import { toCategoryViewModel, toMenuItemViewModel } from "@/app/admin/view-models";
import { getUseCases } from "@/composition/request-scope";
import { MenuItemForm } from "@/app/admin/items/item-form";
import { MenuItemList, type MenuItemRow } from "@/app/admin/items/item-list";

export default async function ItemsPage(): Promise<React.JSX.Element> {
  const restaurant = await getMyRestaurant();
  const { catalog } = await getUseCases();
  const [categories, menuItems] = await Promise.all([
    catalog.listCategories
      .execute({ restaurantId: restaurant.id })
      .then((rows) => rows.map(toCategoryViewModel)),
    catalog.listMenuItems
      .execute({ restaurantId: restaurant.id })
      .then((rows) => rows.map(toMenuItemViewModel)),
  ]);

  // No bulk "tags for all items" read yet — one call per item, fine at this
  // scale (single restaurant, a handful of items).
  const items: MenuItemRow[] = await Promise.all(
    menuItems.map(async (item) => {
      const tags = await catalog.listMenuItemTags.execute({
        restaurantId: restaurant.id,
        menuItemId: item.id,
      });
      return { ...item, tags: tags.map((tag) => tag.name) };
    }),
  );

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl italic text-ink">Platos</h1>
      <p className="mt-2 font-sans text-ink-muted">Cargá platos, precios y disponibilidad.</p>

      {categories.length === 0 ? (
        <p className="mt-8 font-sans text-ink-muted">
          Creá una{" "}
          <Link href="/admin/categories" className="text-ink underline">
            categoría
          </Link>{" "}
          antes de cargar platos.
        </p>
      ) : (
        <div className="mt-8">
          <MenuItemForm categories={categories} />
        </div>
      )}

      <MenuItemList items={items} categories={categories} />
    </div>
  );
}
