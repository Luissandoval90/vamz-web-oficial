import type { ReactNode } from "react";

import { LogoutButton } from "@/components/logout-button";
import { PublicSidebar } from "@/components/public-sidebar";
import { SiteHeader } from "@/components/site-header";
import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/server-auth";

type PublicPageShellProps = {
  active: "home" | "resources" | "gallery" | "admin";
  subtitle: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  heroFooter?: ReactNode;
  children?: ReactNode;
};

export async function PublicPageShell({
  active,
  subtitle,
  title,
  description,
  imageSrc,
  imageAlt,
  heroFooter,
  children,
}: PublicPageShellProps) {
  const user = await getCurrentUser();
  const canPublish = user ? isAdminEmail(user.email) : false;

  return (
    <>
      <SiteHeader
        subtitle={subtitle}
        actions={
          user
            ? []
            : [
                { href: "/login", label: "Login" },
                { href: "/register", label: "Crear cuenta", variant: "primary" as const },
              ]
        }
        extraContent={user ? <LogoutButton className="action-button is-dark" /> : null}
      />

      <main className="page-shell page-body">
        <div className="content-layout">
          <PublicSidebar active={active} canPublish={canPublish} />

          <section className="page-main home-main">
            <section className="panel-card hero-panel">
              <div className="hero-copy">
                <p className="section-kicker">{subtitle}</p>
                <h1 className="page-title page-title-xl">{title}</h1>
                <p className="lead">{description}</p>
                {heroFooter}
              </div>

              <div className="hero-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="hero-media-image" src={imageSrc} alt={imageAlt} />
              </div>
            </section>

            {children ? <section className="home-grid">{children}</section> : null}
          </section>
        </div>
      </main>
    </>
  );
}
