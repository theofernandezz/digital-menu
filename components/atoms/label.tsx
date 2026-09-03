import { cn } from "@/lib/utils";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps): React.JSX.Element {
  return (
    <label
      className={cn("block font-sans text-sm font-medium text-ink", className)}
      {...props}
    />
  );
}
