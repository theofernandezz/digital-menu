type MenuHeaderProps = {
  name: string;
  description: string | null;
};

export function MenuHeader({ name, description }: MenuHeaderProps): React.JSX.Element {
  return (
    <header className="grid gap-2 sm:grid-cols-12">
      <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-muted sm:col-span-12">Carta</p>
      <h1 className="min-w-0 font-display text-6xl italic text-ink break-words sm:col-span-9">{name}</h1>
      {description && (
        <p className="font-sans text-ink-muted sm:col-span-5 sm:col-start-8 sm:self-end sm:text-right">
          {description}
        </p>
      )}
    </header>
  );
}
