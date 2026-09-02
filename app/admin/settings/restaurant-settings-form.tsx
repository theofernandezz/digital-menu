"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateRestaurantAction, type RestaurantFormState } from "@/app/admin/settings/actions";
import type { RestaurantViewModel } from "@/app/admin/view-models";
import { Button } from "@/components/atoms/button";
import { FieldError } from "@/components/atoms/field-error";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Textarea } from "@/components/atoms/textarea";

const initialState: RestaurantFormState = {};

type RestaurantSettingsFormProps = {
  restaurant: RestaurantViewModel;
};

// Publishing status isn't editable here — it's carried as a hidden field at
// its current value so this form never accidentally flips it. Publish /
// unpublish live in publish-toggle.tsx, unpublish behind a confirm dialog
// (it's the risky direction — it turns the public menu off).
export function RestaurantSettingsForm({ restaurant }: RestaurantSettingsFormProps): React.JSX.Element {
  const [state, formAction, isPending] = useActionState(updateRestaurantAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Restaurante actualizado");
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="restaurantId" value={restaurant.id} />
      <input type="hidden" name="isPublished" value={restaurant.isPublished ? "on" : ""} />
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          defaultValue={restaurant.name}
          required
          className="mt-1.5"
          aria-invalid={!!state.errors?.name}
          aria-describedby={state.errors?.name ? "settings-name-error" : undefined}
        />
        <FieldError id="settings-name-error" message={state.errors?.name?.[0]} />
      </div>
      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={restaurant.slug}
          required
          className="mt-1.5"
          aria-invalid={!!state.errors?.slug}
          aria-describedby={state.errors?.slug ? "settings-slug-error" : "settings-slug-hint"}
        />
        <p id="settings-slug-hint" className="mt-1 font-sans text-sm text-ink-muted">
          Minúsculas, números y guiones.
        </p>
        <FieldError id="settings-slug-error" message={state.errors?.slug?.[0]} />
      </div>
      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={restaurant.description ?? ""}
          className="mt-1.5"
          aria-invalid={!!state.errors?.description}
          aria-describedby={state.errors?.description ? "settings-description-error" : undefined}
        />
        <FieldError id="settings-description-error" message={state.errors?.description?.[0]} />
      </div>
      <FieldError id="settings-form-error" message={state.errors?._form?.[0]} />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
