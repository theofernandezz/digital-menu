"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/categories", label: "Categorías" },
  { href: "/admin/items", label: "Platos" },
  { href: "/admin/settings", label: "Ajustes" },
] as const;

export function AdminNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm">
      {NAV_LINKS.map((link) => {
        const isActive = link.href === "/admin" ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "border-b-2 border-transparent pb-0.5 text-ink-muted transition-colors hover:text-ink",
              isActive && "border-accent text-ink",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
