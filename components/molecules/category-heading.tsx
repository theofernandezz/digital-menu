type CategoryHeadingProps = {
  name: string;
  description: string | null;
  index: number;
  total: number;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function CategoryHeading({ name, description, index, total }: CategoryHeadingProps): React.JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-display text-3xl italic text-ink break-words">{name}</h2>
        {description && <p className="mt-1 font-sans text-sm text-ink-muted">{description}</p>}
      </div>
      <span className="shrink-0 font-sans text-xs tracking-wide text-ink-muted tabular-nums">
        {pad(index + 1)} / {pad(total)}
      </span>
    </div>
  );
}
