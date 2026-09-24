"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createTableAction, type TableFormState } from "@/app/admin/tables/actions";
import { Button } from "@/components/atoms/button";
import { FieldError } from "@/components/atoms/field-error";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { MAX_TABLE_NUMBER, MIN_TABLE_NUMBER } from "@/domain/entities/dining-table";

const initialState: TableFormState = {};

export function TableForm(): React.JSX.Element {
  const [state, formAction, isPending] = useActionState(createTableAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      toast.success("Mesa creada");
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Label htmlFor="tableNumber">Número de mesa</Label>
          <Input
            id="tableNumber"
            name="tableNumber"
            type="number"
            inputMode="numeric"
            min={MIN_TABLE_NUMBER}
            max={MAX_TABLE_NUMBER}
            required
            className="mt-1.5"
            aria-invalid={!!state.errors?.tableNumber}
            aria-describedby={state.errors?.tableNumber ? "tableNumber-error" : undefined}
          />
          <FieldError id="tableNumber-error" message={state.errors?.tableNumber?.[0]} />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando..." : "Crear mesa"}
        </Button>
      </div>
      <FieldError id="table-form-error" message={state.errors?._form?.[0]} />
    </form>
  );
}
