import { InvalidCategoryNameError, InvalidDisplayOrderError } from "@/domain/errors/domain-errors";

export type CategoryProps = {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  displayOrder: number;
};

export class Category {
  private constructor(private readonly props: CategoryProps) {}

  static create(props: CategoryProps): Category {
    if (props.name.trim().length === 0) throw new InvalidCategoryNameError();
    if (props.displayOrder < 0) throw new InvalidDisplayOrderError();
    return new Category(props);
  }

  get id(): string {
    return this.props.id;
  }

  get restaurantId(): string {
    return this.props.restaurantId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  withUpdate(patch: Partial<Pick<CategoryProps, "name" | "description" | "displayOrder">>): Category {
    return Category.create({ ...this.props, ...patch });
  }
}
