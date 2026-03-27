import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { SiteHeader } from "@/components/site-header";
import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/server-auth";

export default async function UnauthorizedPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (isAdminEmail(user.email)) {
    redirect("/");
  }

  return (
    <>
      <SiteHeader subtitle="Acceso" actions={[]} />

      <main className="page-shell auth-shell">
        <section className="panel-card animate-up">
          <div className="section-heading">
            <p className="section-kicker">Restringido</p>
            <h1 className="page-title page-title-sm">Este panel es solo para admins.</h1>
            <p className="lead">
              Tu cuenta esta autenticada, pero tu correo no esta dentro de `ADMIN_EMAILS`.
            </p>
          </div>

          <div className="inline-actions">
            <LogoutButton className="action-button is-primary" />
          </div>
        </section>
      </main>
    </>
  );
}
