import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps): React.JSX.Element {
  return (
    <select
      className={cn(
        "block w-full min-h-11 border border-rule bg-paper px-3 py-2",
        "font-sans text-base text-ink",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "aria-[invalid=true]:border-accent",
        className,
      )}
      {...props}
    />
  );
}
