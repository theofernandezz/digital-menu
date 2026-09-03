"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
};

// Fades/slides content in once it enters the viewport. `motion-safe:` only
// applies the hidden starting state, so users with prefers-reduced-motion
// (or a browser without IntersectionObserver) simply see the content
// immediately instead of stuck invisible.
export function ScrollReveal({ children, className }: ScrollRevealProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out",
        !isVisible && "motion-safe:translate-y-3 motion-safe:opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
