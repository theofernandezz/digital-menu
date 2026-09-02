"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createMenuItemAction, type MenuItemFormState } from "@/app/admin/items/actions";
import type { CategoryViewModel } from "@/app/admin/view-models";
import { Button } from "@/components/atoms/button";
import { FieldError } from "@/components/atoms/field-error";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Select } from "@/components/atoms/select";
import { Textarea } from "@/components/atoms/textarea";

const initialState: MenuItemFormState = {};

type MenuItemFormProps = {
  categories: CategoryViewModel[];
};

export function MenuItemForm({ categories }: MenuItemFormProps): React.JSX.Element {
  const [state, formAction, isPending] = useActionState(createMenuItemAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      toast.success("Plato creado");
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            required
            className="mt-1.5"
            aria-invalid={!!state.errors?.name}
            aria-describedby={state.errors?.name ? "item-name-error" : undefined}
          />
          <FieldError id="item-name-error" message={state.errors?.name?.[0]} />
        </div>
        <div>
          <Label htmlFor="categoryId">Categoría</Label>
          <Select
            id="categoryId"
            name="categoryId"
            required
            defaultValue=""
            className="mt-1.5"
            aria-invalid={!!state.errors?.categoryId}
            aria-describedby={state.errors?.categoryId ? "item-category-error" : undefined}
          >
            <option value="" disabled>
              Elegí una categoría
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <FieldError id="item-category-error" message={state.errors?.categoryId?.[0]} />
        </div>
        <div>
          <Label htmlFor="price">Precio</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            className="mt-1.5"
            aria-invalid={!!state.errors?.price}
            aria-describedby={state.errors?.price ? "item-price-error" : undefined}
          />
          <FieldError id="item-price-error" message={state.errors?.price?.[0]} />
        </div>
        <div>
          <Label htmlFor="imageUrl">URL de imagen</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            type="url"
            placeholder="https://…"
            className="mt-1.5"
            aria-invalid={!!state.errors?.imageUrl}
            aria-describedby={state.errors?.imageUrl ? "item-image-error" : undefined}
          />
          <FieldError id="item-image-error" message={state.errors?.imageUrl?.[0]} />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          className="mt-1.5"
          aria-invalid={!!state.errors?.description}
          aria-describedby={state.errors?.description ? "item-description-error" : undefined}
        />
        <FieldError id="item-description-error" message={state.errors?.description?.[0]} />
      </div>
      <div>
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" name="tags" placeholder="Vegano, Sin TACC" className="mt-1.5" />
        <p className="mt-1 font-sans text-sm text-ink-muted">Separados por coma.</p>
      </div>
      <FieldError id="item-form-error" message={state.errors?._form?.[0]} />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creando..." : "Crear plato"}
      </Button>
    </form>
  );
}
