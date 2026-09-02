export default function HomeLoading(): React.JSX.Element {
  return (
    <main className="mx-auto w-full max-w-3xl animate-pulse px-6 py-16 sm:px-10">
      <div className="h-4 w-16 bg-rule" />
      <div className="mt-3 h-14 w-2/3 bg-rule" />
      <div className="mt-16 space-y-10">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className="h-7 w-40 bg-rule" />
            <div className="mt-4 h-px bg-rule" />
            <div className="mt-4 h-16 bg-rule" />
          </div>
        ))}
      </div>
    </main>
  );
}
