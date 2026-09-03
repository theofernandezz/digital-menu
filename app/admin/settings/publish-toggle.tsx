"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { publishRestaurantAction, updateRestaurantAction, type RestaurantFormState } from "@/app/admin/settings/actions";
import type { RestaurantViewModel } from "@/app/admin/view-models";
import { Button } from "@/components/atoms/button";
import { FieldError } from "@/components/atoms/field-error";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PublishToggleProps = {
  restaurant: RestaurantViewModel;
};

// Unpublishing drives submission with useTransition rather than
// useActionState + an effect — see
// app/admin/categories/delete-category-dialog.tsx for why. Publishing is
// the safe direction (turns the menu ON) and stays fire-and-forget.
export function PublishToggle({ restaurant }: PublishToggleProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<RestaurantFormState["errors"]>();
  const [isPending, startTransition] = useTransition();

  function handleUnpublish(formData: FormData): void {
    startTransition(async () => {
      const result = await updateRestaurantAction({}, formData);
      if (result.success) {
        setOpen(false);
        toast.success("Carta despublicada");
      } else {
        setErrors(result.errors);
      }
    });
  }

  return (
    <div className="flex items-center justify-between border border-rule p-5">
      <div>
        <p className="font-sans text-sm font-medium text-ink">
          {restaurant.isPublished ? "La carta está publicada" : "La carta está en borrador"}
        </p>
        <p className="mt-0.5 font-sans text-sm text-ink-muted">
          {restaurant.isPublished
            ? "Cualquiera puede verla en la página pública."
            : "No es visible para el público todavía."}
        </p>
      </div>

      {restaurant.isPublished ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="danger">
              Despublicar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="font-display text-2xl italic text-ink">¿Despublicar la carta?</DialogTitle>
            <DialogDescription className="mt-2 font-sans text-ink-muted">
              La página pública dejará de mostrar el restaurante hasta que la publiques de nuevo.
            </DialogDescription>
            <form action={handleUnpublish} className="mt-6 flex flex-col gap-4">
              <input type="hidden" name="restaurantId" value={restaurant.id} />
              <input type="hidden" name="name" value={restaurant.name} />
              <input type="hidden" name="slug" value={restaurant.slug} />
              <input type="hidden" name="description" value={restaurant.description ?? ""} />
              {/* isPublished intentionally omitted — absence means false */}
              <FieldError id="unpublish-error" message={errors?._form?.[0]} />
              <div className="flex justify-end gap-3">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" variant="danger" disabled={isPending}>
                  {isPending ? "Despublicando..." : "Despublicar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      ) : (
        <form action={publishRestaurantAction}>
          <input type="hidden" name="restaurantId" value={restaurant.id} />
          <input type="hidden" name="name" value={restaurant.name} />
          <input type="hidden" name="slug" value={restaurant.slug} />
          <input type="hidden" name="description" value={restaurant.description ?? ""} />
          <Button type="submit">Publicar</Button>
        </form>
      )}
    </div>
  );
}
