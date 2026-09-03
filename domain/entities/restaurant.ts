import { InvalidRestaurantNameError, InvalidSlugError } from "@/domain/errors/domain-errors";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type RestaurantProps = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  instagram: string | null;
  whatsapp: string | null;
};

export class Restaurant {
  private constructor(private readonly props: RestaurantProps) {}

  static create(props: RestaurantProps): Restaurant {
    if (props.name.trim().length === 0) throw new InvalidRestaurantNameError();
    if (!SLUG_PATTERN.test(props.slug)) throw new InvalidSlugError();
    return new Restaurant(props);
  }

  get id(): string {
    return this.props.id;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get description(): string | null {
    return this.props.description;
  }

  get isPublished(): boolean {
    return this.props.isPublished;
  }

  get instagram(): string | null {
    return this.props.instagram;
  }

  get whatsapp(): string | null {
    return this.props.whatsapp;
  }

  withUpdate(
    patch: Partial<Pick<RestaurantProps, "name" | "slug" | "description" | "isPublished" | "instagram" | "whatsapp">>,
  ): Restaurant {
    return Restaurant.create({ ...this.props, ...patch });
  }
}
