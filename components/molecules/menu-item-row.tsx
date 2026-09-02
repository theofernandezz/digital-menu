import { Price } from "@/components/atoms/price";
import { TagPill } from "@/components/atoms/tag-pill";

type MenuItemRowProps = {
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  tags: string[];
};

export function MenuItemRow({ name, description, price, isAvailable, tags }: MenuItemRowProps): React.JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-6 py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-sans text-base font-medium text-ink">{name}</p>
          {!isAvailable && <TagPill>Agotado</TagPill>}
          {tags.map((tag) => (
            <TagPill key={tag}>{tag}</TagPill>
          ))}
        </div>
        {description && <p className="mt-0.5 max-w-md font-sans text-sm text-ink-muted">{description}</p>}
      </div>
      <Price value={price} className="shrink-0" />
    </div>
  );
}
