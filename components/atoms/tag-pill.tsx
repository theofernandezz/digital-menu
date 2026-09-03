type TagPillProps = {
  children: React.ReactNode;
};

export function TagPill({ children }: TagPillProps): React.JSX.Element {
  return (
    <span className="border border-rule px-2 py-0.5 font-sans text-xs uppercase tracking-wide text-ink-muted">
      {children}
    </span>
  );
}
