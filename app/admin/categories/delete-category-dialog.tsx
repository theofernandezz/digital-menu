"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteCategoryAction, type CategoryFormState } from "@/app/admin/categories/actions";
import type { CategoryViewModel } from "@/app/admin/view-models";
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

type DeleteCategoryDialogProps = {
  category: CategoryViewModel;
};

// Generic cascade warning for now — docs/crud-auth.md requires the delete
// not be silent about ON DELETE CASCADE, but there's no item-count use case
// yet (backend is following up with one). Swap in the real count then.
//
// Submission is driven manually (useTransition), not useActionState — the
// dialog needs to close itself on success, and setting local state from
// inside a useEffect keyed on action state is flagged by
// react-hooks/set-state-in-effect (derived state belongs in the event
// handler that produced it, not synced afterwards).
export function DeleteCategoryDialog({ category }: DeleteCategoryDialogProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<CategoryFormState["errors"]>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData): void {
    startTransition(async () => {
      const result = await deleteCategoryAction({}, formData);
      if (result.success) {
        setOpen(false);
        toast.success("Categoría eliminada");
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
          ¿Eliminar &ldquo;{category.name}&rdquo;?
        </DialogTitle>
        <DialogDescription className="mt-2 font-sans text-ink-muted">
          Esto también elimina todos los platos que están dentro de esta categoría. La acción no se puede deshacer.
        </DialogDescription>
        <form action={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="id" value={category.id} />
          <input type="hidden" name="restaurantId" value={category.restaurantId} />
          <FieldError id={`delete-error-${category.id}`} message={errors?._form?.[0]} />
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
