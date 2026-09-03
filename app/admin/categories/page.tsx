import { createServerSupabaseClient } from "@/adapters/driven/supabase/client";
import { getMyRestaurant } from "@/app/admin/get-restaurant";
import { toCategoryViewModel } from "@/app/admin/view-models";
import { listCategoriesUseCase } from "@/composition/container";
import { CategoryForm } from "@/app/admin/categories/category-form";
import { CategoryList } from "@/app/admin/categories/category-list";

export default async function CategoriesPage(): Promise<React.JSX.Element> {
  const restaurant = await getMyRestaurant();
  const client = await createServerSupabaseClient();
  const categories = (await listCategoriesUseCase(client).execute({ restaurantId: restaurant.id })).map(
    toCategoryViewModel,
  );

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl italic text-ink">Categorías</h1>
      <p className="mt-2 font-sans text-ink-muted">Organizá las secciones de la carta.</p>

      <div className="mt-8">
        <CategoryForm />
      </div>

      <CategoryList categories={categories} />
    </div>
  );
}
