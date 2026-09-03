import { getMyRestaurant } from "@/app/admin/get-restaurant";
import { toRestaurantViewModel } from "@/app/admin/view-models";
import { PublishToggle } from "@/app/admin/settings/publish-toggle";
import { RestaurantSettingsForm } from "@/app/admin/settings/restaurant-settings-form";

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const restaurant = toRestaurantViewModel(await getMyRestaurant());

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-4xl italic text-ink">Ajustes</h1>
      <p className="mt-2 font-sans text-ink-muted">Datos del restaurante, contacto y publicación.</p>

      <div className="mt-8">
        <PublishToggle restaurant={restaurant} />
      </div>

      <div className="mt-10">
        <RestaurantSettingsForm restaurant={restaurant} />
      </div>
    </div>
  );
}
