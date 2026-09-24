"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { closeTableAction, openTableAction, type TableFormState } from "@/app/admin/tables/actions";
import { Button } from "@/components/atoms/button";

type TableRowActionsProps = {
  id: string;
  tableNumber: number;
  isOpen: boolean;
};

const initialState: TableFormState = {};

export function TableRowActions({ id, tableNumber, isOpen }: TableRowActionsProps): React.JSX.Element {
  const [state, formAction, isPending] = useActionState(
    isOpen ? closeTableAction : openTableAction,
    initialState,
  );
  const formError = state.errors?._form?.[0];

  // `state` is a new object on every submit, so a repeated identical error toasts again.
  useEffect(() => {
    if (formError) toast.error(formError);
  }, [state, formError]);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant={isOpen ? "danger" : "secondary"}
        disabled={isPending}
        aria-label={`${isOpen ? "Cerrar" : "Abrir"} mesa ${tableNumber}`}
      >
        {isOpen ? "Cerrar mesa" : "Abrir mesa"}
      </Button>
    </form>
  );
}
