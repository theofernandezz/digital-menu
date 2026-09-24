import { headers } from "next/headers";
import { getMyRestaurant } from "@/app/admin/get-restaurant";
import { toDiningTableViewModel } from "@/app/admin/view-models";
import { TableForm } from "@/app/admin/tables/table-form";
import { TableList } from "@/app/admin/tables/table-list";
import { buildTableLink, getRequestOrigin } from "@/app/admin/tables/table-link";
import { getUseCases } from "@/composition/request-scope";

export default async function TablesPage(): Promise<React.JSX.Element> {
  const restaurant = await getMyRestaurant();
  const { ordering } = await getUseCases();
  const origin = getRequestOrigin(await headers());
  const tables = (await ordering.listTables.execute({ restaurantId: restaurant.id })).map((table) =>
    toDiningTableViewModel(table, buildTableLink(origin, table.qrToken)),
  );

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl italic text-ink">Mesas</h1>
      <p className="mt-2 font-sans text-ink-muted">
        Abrí una mesa cuando se sienten los comensales y cerrala cuando se vayan.
      </p>

      <div className="mt-8">
        <TableForm />
      </div>

      <TableList tables={tables} />
    </div>
  );
}
