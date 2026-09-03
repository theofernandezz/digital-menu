"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateCategoryAction, type CategoryFormState } from "@/app/admin/categories/actions";
import type { CategoryViewModel } from "@/app/admin/view-models";
import { Button } from "@/components/atoms/button";
import { FieldError } from "@/components/atoms/field-error";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type EditCategoryDialogProps = {
  category: CategoryViewModel;
};

// See delete-category-dialog.tsx for why this drives submission with
// useTransition instead of useActionState + an effect.
export function EditCategoryDialog({ category }: EditCategoryDialogProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<CategoryFormState["errors"]>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData): void {
    startTransition(async () => {
      const result = await updateCategoryAction({}, formData);
      if (result.success) {
        setOpen(false);
        toast.success("Categoría actualizada");
      } else {
        setErrors(result.errors);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-display text-2xl italic text-ink">Editar categoría</DialogTitle>
        <DialogDescription className="sr-only">
          Modificá el nombre y la descripción de la categoría.
        </DialogDescription>
        <form action={handleSubmit} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={category.id} />
          <input type="hidden" name="restaurantId" value={category.restaurantId} />
          <div>
            <Label htmlFor={`edit-name-${category.id}`}>Nombre</Label>
            <Input
              id={`edit-name-${category.id}`}
              name="name"
              defaultValue={category.name}
              required
              className="mt-1.5"
              aria-invalid={!!errors?.name}
              aria-describedby={errors?.name ? `edit-name-error-${category.id}` : undefined}
            />
            <FieldError id={`edit-name-error-${category.id}`} message={errors?.name?.[0]} />
          </div>
          <div>
            <Label htmlFor={`edit-description-${category.id}`}>Descripción</Label>
            <Input
              id={`edit-description-${category.id}`}
              name="description"
              defaultValue={category.description ?? ""}
              className="mt-1.5"
            />
          </div>
          <FieldError id={`edit-form-error-${category.id}`} message={errors?._form?.[0]} />
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
