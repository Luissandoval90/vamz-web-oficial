import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { PublicFrame } from "@/components/public-frame";
import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/server-auth";
export default async function UnauthorizedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isAdminEmail(user.email)) redirect("/");
  return (
    <PublicFrame>
      <main id="contenido" className="page-shell auth-shell">
        <section className="auth-card">
          <p className="section-kicker">ACCESO RESTRINGIDO</p>
          <h1 className="section-title">Este espacio es privado.</h1>
          <p className="lead">
            Tu cuenta no tiene permisos para entrar al panel de administración.
            Puedes seguir explorando los recursos de la comunidad.
          </p>
          <div className="inline-actions" style={{ marginTop: 25 }}>
            <Link className="action-button is-accent" href="/recursos">
              Explorar recursos
            </Link>
            <LogoutButton />
          </div>
        </section>
      </main>
    </PublicFrame>
  );
}
