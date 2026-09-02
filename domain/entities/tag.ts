import { InvalidTagNameError } from "@/domain/errors/domain-errors";

export type TagProps = {
  id: string;
  restaurantId: string;
  name: string;
};

export class Tag {
  private constructor(private readonly props: TagProps) {}

  static create(props: TagProps): Tag {
    if (props.name.trim().length === 0) throw new InvalidTagNameError();
    return new Tag(props);
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
}
