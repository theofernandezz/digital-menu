"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createCategoryAction, type CategoryFormState } from "@/app/admin/categories/actions";
import { Button } from "@/components/atoms/button";
import { FieldError } from "@/components/atoms/field-error";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";

const initialState: CategoryFormState = {};

export function CategoryForm(): React.JSX.Element {
  const [state, formAction, isPending] = useActionState(createCategoryAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      toast.success("Categoría creada");
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            required
            className="mt-1.5"
            aria-invalid={!!state.errors?.name}
            aria-describedby={state.errors?.name ? "name-error" : undefined}
          />
          <FieldError id="name-error" message={state.errors?.name?.[0]} />
        </div>
        <div>
          <Label htmlFor="description">Descripción</Label>
          <Input
            id="description"
            name="description"
            className="mt-1.5"
            aria-invalid={!!state.errors?.description}
            aria-describedby={state.errors?.description ? "description-error" : undefined}
          />
          <FieldError id="description-error" message={state.errors?.description?.[0]} />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando..." : "Crear categoría"}
        </Button>
      </div>
      <FieldError id="category-form-error" message={state.errors?._form?.[0]} />
    </form>
  );
}
