import { toggleMenuItemAvailabilityAction } from "@/app/admin/items/actions";
import type { MenuItemViewModel } from "@/app/admin/view-models";
import { Button } from "@/components/atoms/button";

type AvailabilityToggleFormProps = {
  item: MenuItemViewModel;
};

// Presence of the hidden isAvailable field is what the action reads
// (unchecked-checkbox convention, see actions.ts) — included only when the
// target state is "available".
export function AvailabilityToggleForm({ item }: AvailabilityToggleFormProps): React.JSX.Element {
  return (
    <form action={toggleMenuItemAvailabilityAction}>
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="restaurantId" value={item.restaurantId} />
      <input type="hidden" name="categoryId" value={item.categoryId} />
      <input type="hidden" name="name" value={item.name} />
      <input type="hidden" name="description" value={item.description ?? ""} />
      <input type="hidden" name="price" value={item.price} />
      <input type="hidden" name="imageUrl" value={item.imageUrl ?? ""} />
      {!item.isAvailable && <input type="hidden" name="isAvailable" value="on" />}
      <Button type="submit" variant="secondary">
        {item.isAvailable ? "Marcar agotado" : "Marcar disponible"}
      </Button>
    </form>
  );
}
