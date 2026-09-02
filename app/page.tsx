import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/adapters/driven/supabase/client";
import { getPublishedMenuUseCase } from "@/composition/container";
import { PublicMenuTemplate } from "@/components/templates/public-menu-template";

export default async function HomePage(): Promise<React.JSX.Element> {
  const client = await createServerSupabaseClient();
  const menu = await getPublishedMenuUseCase(client).execute();

  // null means the restaurant isn't published — a "not live yet" state, not
  // a broken URL, but the public route has nothing else to show either way.
  if (!menu) notFound();

  return <PublicMenuTemplate menu={menu} />;
}
