"use client";

import { useEffect } from "react";
import { Button } from "@/components/atoms/button";

type HomeErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function HomeError({ error, reset }: HomeErrorProps): React.JSX.Element {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div role="alert" className="max-w-sm text-center">
        <h1 className="font-display text-4xl italic text-ink">Algo salió mal</h1>
        <p className="mt-3 font-sans text-ink-muted">No pudimos cargar la carta. Probá de nuevo.</p>
        <Button type="button" onClick={reset} className="mt-6">
          Reintentar
        </Button>
      </div>
    </main>
  );
}
