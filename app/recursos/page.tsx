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
            <p className="section-kicker">Biblioteca de VAMZ</p>
            <h1 className="page-title">
              Encuentra tu próximo recurso.
            </h1>
            <p className="lead">
              Busca por nombre, filtra por tipo y descarga lo que necesitas para tu mundo.
            </p>
          </div>
          <div className="catalog-heading-mark" aria-hidden="true">
            <span>{resources.length}</span>
          </div>
        </div>
        <ResourceCatalog resources={resources} />
        <section className="contribute-banner">
          <div><h2>¿Buscas una versión de Minecraft?</h2><p>Consulta las versiones disponibles por edición y dispositivo.</p></div>
          <Link className="action-button is-accent" href="/minecraft">Ver versiones</Link>
        </section>
      </main>
    </PublicFrame>
  );
}
