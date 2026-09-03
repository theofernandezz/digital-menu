import type { PublishedMenu } from "@/application/use-cases/get-published-menu";
import { MenuHeader } from "@/components/organisms/menu-header";
import { MenuCategorySection } from "@/components/organisms/menu-category-section";

type PublicMenuTemplateProps = {
  menu: PublishedMenu;
};

export function PublicMenuTemplate({ menu }: PublicMenuTemplateProps): React.JSX.Element {
  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10">
      <MenuHeader name={menu.restaurantName} description={menu.restaurantDescription} />

      {menu.categories.length === 0 ? (
        <p className="mt-16 font-sans text-ink-muted">La carta todavía no tiene categorías cargadas.</p>
      ) : (
        <div className="mt-16 space-y-16">
          {menu.categories.map((category, index) => (
            <MenuCategorySection
              key={category.id}
              name={category.name}
              description={category.description}
              index={index}
              total={menu.categories.length}
              items={category.items}
            />
          ))}
        </div>
      )}
    </main>
  );
}
