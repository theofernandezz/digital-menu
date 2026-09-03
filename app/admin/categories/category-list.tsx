import type { CategoryViewModel } from "@/app/admin/view-models";
import { DeleteCategoryDialog } from "@/app/admin/categories/delete-category-dialog";
import { EditCategoryDialog } from "@/app/admin/categories/edit-category-dialog";
import { Rule } from "@/components/atoms/rule";

type CategoryListProps = {
  categories: CategoryViewModel[];
};

export function CategoryList({ categories }: CategoryListProps): React.JSX.Element {
  if (categories.length === 0) {
    return <p className="mt-8 font-sans text-ink-muted">Todavía no hay categorías. Creá la primera arriba.</p>;
  }

  return (
    <ul className="mt-8">
      {categories.map((category, index) => (
        <li key={category.id}>
          {index > 0 && <Rule />}
          <div className="flex flex-col gap-3 py-4">
            <div>
              <p className="font-sans text-base font-medium text-ink">{category.name}</p>
              {category.description && (
                <p className="mt-0.5 font-sans text-sm text-ink-muted">{category.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <EditCategoryDialog category={category} />
              <DeleteCategoryDialog category={category} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
