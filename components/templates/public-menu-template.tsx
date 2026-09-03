import type { PublishedMenu } from "@/application/use-cases/get-published-menu";
import { FilterableMenu } from "@/components/organisms/filterable-menu";
import { MenuHeader } from "@/components/organisms/menu-header";

type PublicMenuTemplateProps = {
  menu: PublishedMenu;
};

export function PublicMenuTemplate({ menu }: PublicMenuTemplateProps): React.JSX.Element {
  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10">
      <MenuHeader
        name={menu.restaurantName}
        description={menu.restaurantDescription}
        instagram={menu.restaurantInstagram}
        whatsapp={menu.restaurantWhatsapp}
      />

      {menu.categories.length === 0 ? (
        <p className="mt-16 font-sans text-ink-muted">La carta todavía no tiene categorías cargadas.</p>
      ) : (
        <div className="mt-16">
          <FilterableMenu categories={menu.categories} />
        </div>
      )}
    </main>
  );
}
