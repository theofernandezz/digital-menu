import type { DiningTableViewModel } from "@/app/admin/view-models";
import { TableRowActions } from "@/app/admin/tables/table-row-actions";
import { Rule } from "@/components/atoms/rule";
import { cn } from "@/lib/utils";

type TableListProps = {
  tables: DiningTableViewModel[];
};

export function TableList({ tables }: TableListProps): React.JSX.Element {
  if (tables.length === 0) {
    return <p className="mt-8 font-sans text-ink-muted">Todavía no hay mesas. Creá la primera arriba.</p>;
  }

  return (
    <ul className="mt-8">
      {tables.map((table, index) => (
        <li key={table.id}>
          {index > 0 && <Rule />}
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-baseline gap-3 font-sans text-base font-medium text-ink">
                <span>Mesa {table.tableNumber}</span>
                <span
                  className={cn(
                    "text-xs font-normal uppercase tracking-wide",
                    table.isOpen ? "text-ink" : "text-ink-muted",
                  )}
                >
                  {table.isOpen ? "Abierta" : "Cerrada"}
                </span>
              </p>
              <a
                href={table.link}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 block break-all font-sans text-sm text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
              >
                {table.link}
              </a>
            </div>
            <TableRowActions id={table.id} tableNumber={table.tableNumber} isOpen={table.isOpen} />
          </div>
        </li>
      ))}
    </ul>
  );
}
