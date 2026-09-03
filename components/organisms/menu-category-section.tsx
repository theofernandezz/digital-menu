import { CategoryHeading } from "@/components/molecules/category-heading";
import { MenuItemRow } from "@/components/molecules/menu-item-row";
import { Rule } from "@/components/atoms/rule";

type MenuCategorySectionProps = {
  name: string;
  description: string | null;
  index: number;
  total: number;
  items: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    isAvailable: boolean;
    tags: string[];
  }[];
};

export function MenuCategorySection({
  name,
  description,
  index,
  total,
  items,
}: MenuCategorySectionProps): React.JSX.Element {
  return (
    <section>
      <CategoryHeading name={name} description={description} index={index} total={total} />
      <Rule className="mt-4" />
      <div>
        {items.map((item, itemIndex) => (
          <div key={item.id}>
            {itemIndex > 0 && <Rule />}
            <MenuItemRow
              name={item.name}
              description={item.description}
              price={item.price}
              isAvailable={item.isAvailable}
              tags={item.tags}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
