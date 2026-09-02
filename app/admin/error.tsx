"use client";

import { useEffect } from "react";
import { Button } from "@/components/atoms/button";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: AdminErrorProps): React.JSX.Element {
  useEffect(() => {
    // Logged client-side only — the domain/use-case layer never leaks its
    // real error text to the rendered UI (see docs/crud-auth.md).
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="max-w-md">
      <h1 className="font-display text-3xl italic text-ink">Algo salió mal</h1>
      <p className="mt-2 font-sans text-ink-muted">
        No pudimos cargar esta sección. Probá de nuevo.
      </p>
      <Button type="button" onClick={reset} className="mt-6">
        Reintentar
      </Button>
    </div>
  );
}
