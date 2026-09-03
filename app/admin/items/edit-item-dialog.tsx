"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateMenuItemAction, type MenuItemFormState } from "@/app/admin/items/actions";
import type { CategoryViewModel, MenuItemViewModel } from "@/app/admin/view-models";
import { Button } from "@/components/atoms/button";
import { Checkbox } from "@/components/atoms/checkbox";
import { FieldError } from "@/components/atoms/field-error";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Select } from "@/components/atoms/select";
import { Textarea } from "@/components/atoms/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type EditMenuItemDialogProps = {
  item: MenuItemViewModel;
  categories: CategoryViewModel[];
  tags: string[];
};

// See app/admin/categories/delete-category-dialog.tsx for why this drives
// submission with useTransition instead of useActionState + an effect.
export function EditMenuItemDialog({ item, categories, tags }: EditMenuItemDialogProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<MenuItemFormState["errors"]>();
  const [isPending, startTransition] = useTransition();
  const fieldId = (field: string): string => `edit-item-${field}-${item.id}`;

  function handleSubmit(formData: FormData): void {
    startTransition(async () => {
      const result = await updateMenuItemAction({}, formData);
      if (result.success) {
        setOpen(false);
        toast.success("Plato actualizado");
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
        <DialogTitle className="font-display text-2xl italic text-ink">Editar plato</DialogTitle>
        <DialogDescription className="sr-only">Modificá los datos del plato.</DialogDescription>
        <form action={handleSubmit} className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="restaurantId" value={item.restaurantId} />
          <div>
            <Label htmlFor={fieldId("name")}>Nombre</Label>
            <Input
              id={fieldId("name")}
              name="name"
              defaultValue={item.name}
              required
              className="mt-1.5"
              aria-invalid={!!errors?.name}
            />
            <FieldError id={`${fieldId("name")}-error`} message={errors?.name?.[0]} />
          </div>
          <div>
            <Label htmlFor={fieldId("category")}>Categoría</Label>
            <Select
              id={fieldId("category")}
              name="categoryId"
              defaultValue={item.categoryId}
              required
              className="mt-1.5"
              aria-invalid={!!errors?.categoryId}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <FieldError id={`${fieldId("category")}-error`} message={errors?.categoryId?.[0]} />
          </div>
          <div>
            <Label htmlFor={fieldId("price")}>Precio</Label>
            <Input
              id={fieldId("price")}
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item.price}
              required
              className="mt-1.5"
              aria-invalid={!!errors?.price}
            />
            <FieldError id={`${fieldId("price")}-error`} message={errors?.price?.[0]} />
          </div>
          <div>
            <Label htmlFor={fieldId("image")}>URL de imagen</Label>
            <Input
              id={fieldId("image")}
              name="imageUrl"
              type="url"
              defaultValue={item.imageUrl ?? ""}
              className="mt-1.5"
              aria-invalid={!!errors?.imageUrl}
            />
            <FieldError id={`${fieldId("image")}-error`} message={errors?.imageUrl?.[0]} />
          </div>
          <div>
            <Label htmlFor={fieldId("description")}>Descripción</Label>
            <Textarea
              id={fieldId("description")}
              name="description"
              defaultValue={item.description ?? ""}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor={fieldId("tags")}>Tags</Label>
            <Input
              id={fieldId("tags")}
              name="tags"
              defaultValue={tags.join(", ")}
              placeholder="Vegano, Sin TACC"
              className="mt-1.5"
            />
            <p className="mt-1 font-sans text-sm text-ink-muted">Separados por coma.</p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={fieldId("available")} name="isAvailable" defaultChecked={item.isAvailable} />
            <Label htmlFor={fieldId("available")} className="!mb-0">
              Disponible
            </Label>
          </div>
          <FieldError id={`${fieldId("form")}-error`} message={errors?._form?.[0]} />
          <div className="flex justify-end gap-3 pt-2">
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
