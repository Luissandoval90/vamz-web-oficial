import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { PublicFrame } from "@/components/public-frame";
type PublicPageShellProps = {
  active: "home" | "resources" | "gallery" | "admin";
  subtitle: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  pageBackdrop?: ReactNode;
  heroBackdrop?: ReactNode;
  heroFooter?: ReactNode;
  children?: ReactNode;
};
export async function PublicPageShell({
  subtitle,
  title,
  description,
  imageSrc,
  imageAlt,
  heroFooter,
  children,
}: PublicPageShellProps) {
  return (
    <PublicFrame>
      <main id="contenido" className="page-shell page-body">
        <nav className="breadcrumbs" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link>
          <span>/</span>
          <Link href="/recursos">Recursos</Link>
          <span>/</span>
          <span>{subtitle}</span>
        </nav>
        <section className="detail-hero">
          <div className="hero-copy">
            <p className="section-kicker">{subtitle}</p>
            <h1 className="page-title">{title}</h1>
            <p className="lead">{description}</p>
            {heroFooter}
          </div>
          <div className="detail-hero-media">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(max-width: 720px) 100vw, 40vw"
              unoptimized={imageSrc.startsWith("/api/")}
            />
          </div>
        </section>
        <div className="home-grid">{children}</div>
      </main>
    </PublicFrame>
  );
}
