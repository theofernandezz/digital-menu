import {
  InvalidMenuItemNameError,
  InvalidPriceError,
  InvalidDisplayOrderError,
} from "@/domain/errors/domain-errors";

export type MenuItemProps = {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  displayOrder: number;
};

export class MenuItem {
  private constructor(private readonly props: MenuItemProps) {}

  static create(props: MenuItemProps): MenuItem {
    if (props.name.trim().length === 0) throw new InvalidMenuItemNameError();
    if (props.price < 0) throw new InvalidPriceError();
    if (props.displayOrder < 0) throw new InvalidDisplayOrderError();
    return new MenuItem(props);
  }

  get id(): string {
    return this.props.id;
  }

  get restaurantId(): string {
    return this.props.restaurantId;
  }

  get categoryId(): string {
    return this.props.categoryId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get price(): number {
    return this.props.price;
  }

  get imageUrl(): string | null {
    return this.props.imageUrl;
  }

  get isAvailable(): boolean {
    return this.props.isAvailable;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  withUpdate(
    patch: Partial<
      Pick<MenuItemProps, "categoryId" | "name" | "description" | "price" | "imageUrl" | "isAvailable" | "displayOrder">
    >,
  ): MenuItem {
    return MenuItem.create({ ...this.props, ...patch });
  }
}
