import type { Metadata } from "next";
import { PublicFrame } from "@/components/public-frame";
import { ResourceCatalog } from "@/components/resource-catalog";
import { getPublicResources } from "@/lib/public-content";
import { getFileExtension, imageExtensions } from "@/lib/resource-utils";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Galería" };
export default async function GaleriaPage() {
  const resources = (await getPublicResources()).filter((resource) =>
    imageExtensions.has(getFileExtension(resource.filename)),
  );
  return (
    <PublicFrame>
      <main
        id="contenido"
        className="page-shell catalog-page"
        style={{ paddingTop: 45 }}
      >
        <p className="section-kicker">GALERÍA VAMZ</p>
        <h1 className="page-title">Un estilo propio.</h1>
        <p className="lead" style={{ marginBottom: 35 }}>
          Explora las portadas e imágenes publicadas en la biblioteca.
        </p>
        <ResourceCatalog resources={resources} />
      </main>
    </PublicFrame>
  );
}
