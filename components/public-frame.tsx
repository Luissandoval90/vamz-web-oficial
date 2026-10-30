import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/server-auth";
export async function PublicFrame({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader
        actions={
          user
            ? []
            : [
                { href: "/login", label: "Iniciar sesión" },
                {
                  href: "/register",
                  label: "Crear cuenta",
                  variant: "primary",
                },
              ]
        }
        extraContent={
          user ? (
            <>
              <Link className="action-button is-accent" href="/dashboard">Mi panel</Link>
              <LogoutButton className="action-button is-text" />
            </>
          ) : null
        }
      />
      {children}
      <SiteFooter />
    </>
  );
}
