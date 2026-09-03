import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, rows = 3, ...props }: TextareaProps): React.JSX.Element {
  return (
    <textarea
      rows={rows}
      className={cn(
        "block w-full border border-rule bg-paper px-3 py-2",
        "font-sans text-base text-ink placeholder:text-ink-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "aria-[invalid=true]:border-accent",
        className,
      )}
      {...props}
    />
  );
}
