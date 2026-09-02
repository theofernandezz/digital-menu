import { requireAuth } from "@/adapters/driven/supabase/require-auth";
import { AdminNav } from "@/app/admin/admin-nav";
import { signOutAction } from "@/app/admin/actions";
import { Button } from "@/components/atoms/button";
import { Rule } from "@/components/atoms/rule";

export default async function AdminLayout({ children }: LayoutProps<"/admin">): Promise<React.JSX.Element> {
  const user = await requireAuth();

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-6 pt-8 sm:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-muted">Admin</p>
            <AdminNav />
          </div>
          <div className="flex items-center gap-4">
            <span className="font-sans text-sm text-ink-muted">{user.email}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="secondary">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
        <Rule className="mt-6" />
      </header>
      <main id="main-content" className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
