"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteMenuItemAction, type MenuItemFormState } from "@/app/admin/items/actions";
import type { MenuItemViewModel } from "@/app/admin/view-models";
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

type DeleteMenuItemDialogProps = {
  item: MenuItemViewModel;
};

// See app/admin/categories/delete-category-dialog.tsx for why this drives
// submission with useTransition instead of useActionState + an effect.
export function DeleteMenuItemDialog({ item }: DeleteMenuItemDialogProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<MenuItemFormState["errors"]>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData): void {
    startTransition(async () => {
      const result = await deleteMenuItemAction({}, formData);
      if (result.success) {
        setOpen(false);
        toast.success("Plato eliminado");
      } else {
        setErrors(result.errors);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="danger">
          Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-display text-2xl italic text-ink">
          ¿Eliminar &ldquo;{item.name}&rdquo;?
        </DialogTitle>
        <DialogDescription className="mt-2 font-sans text-ink-muted">
          Esto quita el plato de la carta. La acción no se puede deshacer.
        </DialogDescription>
        <form action={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="restaurantId" value={item.restaurantId} />
          <FieldError id={`delete-item-error-${item.id}`} message={errors?._form?.[0]} />
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" variant="danger" disabled={isPending}>
              {isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
