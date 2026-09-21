import { notFound } from "next/navigation";
import { getUseCases } from "@/composition/request-scope";
import { PublicMenuTemplate } from "@/components/templates/public-menu-template";

export default async function HomePage(): Promise<React.JSX.Element> {
  const { catalog } = await getUseCases();
  const menu = await catalog.getPublishedMenu.execute();

  // null means the restaurant isn't published — a "not live yet" state, not
  // a broken URL, but the public route has nothing else to show either way.
  if (!menu) notFound();

  return <PublicMenuTemplate menu={menu} />;
}
