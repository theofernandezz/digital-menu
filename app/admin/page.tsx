import Link from "next/link";
import { createServerSupabaseClient } from "@/adapters/driven/supabase/client";
import { getMyRestaurant } from "@/app/admin/get-restaurant";
import { toRestaurantViewModel } from "@/app/admin/view-models";
import { listCategoriesUseCase, listMenuItemsUseCase } from "@/composition/container";

const SECTIONS = [
  { href: "/admin/categories", label: "Categorías", description: "Organizá las secciones de la carta." },
  { href: "/admin/items", label: "Platos", description: "Cargá platos, precios y disponibilidad." },
  { href: "/admin/settings", label: "Ajustes", description: "Datos del restaurante, contacto y publicación." },
] as const;

export default async function AdminPage(): Promise<React.JSX.Element> {
  const restaurant = toRestaurantViewModel(await getMyRestaurant());
  const client = await createServerSupabaseClient();
  const [categories, items] = await Promise.all([
    listCategoriesUseCase(client).execute({ restaurantId: restaurant.id }),
    listMenuItemsUseCase(client).execute({ restaurantId: restaurant.id }),
  ]);
  const soldOutCount = items.filter((item) => !item.isAvailable).length;

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-4xl italic text-ink">{restaurant.name}</h1>
        <div className="flex items-center gap-4">
          <span className="font-sans text-xs uppercase tracking-wide text-ink-muted">
            {restaurant.isPublished ? "Publicado" : "Borrador"}
          </span>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-sm text-ink underline underline-offset-4 transition-colors hover:text-ink-muted"
          >
            Ver carta pública ↗
          </Link>
        </div>
      </div>
      {restaurant.description && (
        <p className="mt-2 max-w-prose font-sans text-ink-muted">{restaurant.description}</p>
      )}
      <p className="mt-4 font-sans text-sm text-ink-muted">
        {categories.length} {categories.length === 1 ? "categoría" : "categorías"} · {items.length}{" "}
        {items.length === 1 ? "plato" : "platos"}
        {soldOutCount > 0 && ` · ${soldOutCount} ${soldOutCount === 1 ? "agotado" : "agotados"}`}
      </p>

      <div className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex flex-col gap-1.5 bg-paper p-5 transition-colors hover:bg-ink/5"
          >
            <span className="font-sans text-base font-medium text-ink">{section.label}</span>
            <span className="font-sans text-sm text-ink-muted">{section.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
