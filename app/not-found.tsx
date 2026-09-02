export default function NotFound(): React.JSX.Element {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="max-w-sm text-center">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-muted">Carta</p>
        <h1 className="mt-2 font-display text-4xl italic text-ink">Todavía no está lista</h1>
        <p className="mt-3 font-sans text-ink-muted">Volvé a pasar más tarde.</p>
      </div>
    </main>
  );
}
