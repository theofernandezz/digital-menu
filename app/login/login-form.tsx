"use client";

import { useActionState } from "react";
import { signInAction, type SignInState } from "@/app/login/actions";
import { Button } from "@/components/atoms/button";
import { FieldError } from "@/components/atoms/field-error";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";

const initialState: SignInState = {};

export function LoginForm(): React.JSX.Element {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div>
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1.5"
          aria-invalid={!!state.errors?.email}
          aria-describedby={state.errors?.email ? "email-error" : undefined}
        />
        <FieldError id="email-error" message={state.errors?.email?.[0]} />
      </div>

      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5"
          aria-invalid={!!state.errors?.password}
          aria-describedby={state.errors?.password ? "password-error" : undefined}
        />
        <FieldError id="password-error" message={state.errors?.password?.[0]} />
      </div>

      <FieldError id="form-error" message={state.errors?._form?.[0]} />

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}
