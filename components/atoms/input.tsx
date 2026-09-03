import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps): React.JSX.Element {
  return (
    <input
      className={cn(
        "block w-full min-h-11 border border-rule bg-paper px-3 py-2",
        "font-sans text-base text-ink placeholder:text-ink-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "aria-[invalid=true]:border-accent",
        className,
      )}
      {...props}
    />
  );
}
