export default function AdminLoading(): React.JSX.Element {
  return (
    <div className="max-w-3xl animate-pulse">
      <div className="h-9 w-56 bg-rule" />
      <div className="mt-4 h-4 w-80 bg-rule" />
      <div className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-paper" />
        ))}
      </div>
    </div>
  );
}
