"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/button";
import { Price } from "@/components/atoms/price";
import { TagPill } from "@/components/atoms/tag-pill";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type MenuItemRowProps = {
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  tags: string[];
};

export function MenuItemRow({
  name,
  description,
  price,
  imageUrl,
  isAvailable,
  tags,
}: MenuItemRowProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const hasPhoto = imageUrl !== null;

  const content = (
    <div
      className={cn(
        "flex items-baseline justify-between gap-6 rounded-sm px-2 py-4 -mx-2 transition-colors",
        hasPhoto && "hover:bg-ink/[0.03]",
      )}
    >
      <div className="flex min-w-0 items-baseline gap-3">
        {/* Admins can set any external URL, not just Supabase Storage —
            next/image would need every domain whitelisted in next.config.ts,
            impractical for an owner-entered field, so a plain <img> here. */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="size-12 shrink-0 self-center rounded-full border border-rule object-cover"
          />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-sans text-base font-medium text-ink">{name}</p>
            {!isAvailable && <TagPill>Agotado</TagPill>}
            {tags.map((tag) => (
              <TagPill key={tag}>{tag}</TagPill>
            ))}
          </div>
          {description && <p className="mt-0.5 max-w-md font-sans text-sm text-ink-muted">{description}</p>}
        </div>
      </div>
      <Price value={price} className="shrink-0" />
    </div>
  );

  // No photo → nothing more to show than what's already on the row (the
  // description is never truncated here), so it stays a static, non-focusable
  // row. See docs discussion: click-through only earns its keep when there's
  // a bigger photo behind it.
  if (!imageUrl) return content;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="block w-full cursor-pointer rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          {content}
        </button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0">
        <img src={imageUrl} alt="" className="aspect-square w-full object-cover" />
        <div className="p-6">
          <DialogTitle className="font-sans text-2xl font-medium text-ink">{name}</DialogTitle>
          <DialogDescription className="sr-only">Detalle del plato.</DialogDescription>
          {(!isAvailable || tags.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {!isAvailable && <TagPill>Agotado</TagPill>}
              {tags.map((tag) => (
                <TagPill key={tag}>{tag}</TagPill>
              ))}
            </div>
          )}
          {description && <p className="mt-3 font-sans text-sm text-ink-muted">{description}</p>}
          <div className="mt-5 flex items-center justify-between">
            <Price value={price} />
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cerrar
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
