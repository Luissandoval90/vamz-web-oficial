import type { Metadata } from "next";
import Link from "next/link";
import { PublicFrame } from "@/components/public-frame";
import { ResourceCatalog } from "@/components/resource-catalog";
import { getPublicResources } from "@/lib/public-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Recursos",
  description:
    "Explora y descarga los recursos y portadas publicados por VAMZ Studio.",
};

export default async function RecursosPage() {
  const resources = await getPublicResources();
  return (
    <PublicFrame>
      <main className="page-shell catalog-page" id="contenido">
        <nav className="breadcrumbs" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link>
          <span>/</span>
          <span aria-current="page">Recursos</span>
        </nav>
        <div className="catalog-page-heading">
          <div>
            <p className="section-kicker">EXPLORA. ENCUENTRA. CREA.</p>
            <h1 className="page-title">
              Tu siguiente idea
              <br />
              empieza <span className="text-accent">aquí.</span>
            </h1>
            <p className="lead">
              Todos los recursos de VAMZ, sin vueltas.
              <br />
              Encuentra lo que buscas y hazlo parte de tu mundo.
            </p>
          </div>
          <div className="catalog-heading-mark" aria-hidden="true">
            ↙
          </div>
        </div>
        <ResourceCatalog resources={resources} />
        <section className="contribute-banner">
          <div><h2>Comparte tus creaciones.</h2><p>Crea una cuenta y dispone de 180 MB para tus recursos y portadas.</p></div>
          <Link className="action-button is-accent" href="/dashboard">Subir un recurso</Link>
        </section>
      </main>
    </PublicFrame>
  );
}
