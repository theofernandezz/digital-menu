import { cn } from "@/lib/utils";

type PriceProps = {
  value: number;
  className?: string;
};

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function Price({ value, className }: PriceProps): React.JSX.Element {
  return (
    <span className={cn("font-sans text-base font-medium tabular-nums text-ink", className)}>
      {currencyFormatter.format(value)}
    </span>
  );
}
