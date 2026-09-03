type FieldErrorProps = {
  id: string;
  message: string | undefined;
};

export function FieldError({ id, message }: FieldErrorProps): React.JSX.Element | null {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="mt-1 font-sans text-sm text-accent">
      {message}
    </p>
  );
}
