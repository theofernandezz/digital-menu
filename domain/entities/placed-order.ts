// An order exactly as it was stored: the lines carry the name and price
// snapshots taken at order time. `menuSubtotal` is the sum of the menu items
// only — service, cover and tip are handled outside the system.
export type PlacedOrderItem = {
  name: string;
  unitPrice: number;
  quantity: number;
  notes: string | null;
};

export type PlacedOrder = {
  orderId: string;
  placedAt: string;
  menuSubtotal: number;
  items: PlacedOrderItem[];
};
