import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PublicFrame } from "@/components/public-frame";
import { DownloadSwitchButton } from "@/components/download-switch-button";
import { ResourceThumb } from "@/components/resource-thumb";
import { ResourceReviews } from "@/components/resource-reviews";
import { ResourceMetrics } from "@/components/resource-metrics";
import { UiIcon } from "@/components/ui-icon";
import { getDb } from "@/db";
import { resources, users, minecraftVersions } from "@/db/schema";
import {
  formatBytes,
  formatResourceDate,
  getFileExtension,
  getResourceKind,
} from "@/lib/resource-utils";
import { getDisplayUsername } from "@/lib/usernames";
import { getCurrentUser } from "@/lib/server-auth";
import {
  getResourceReviews,
  getResourceSummary,
} from "@/lib/resource-engagement";
import { engagementColumns } from "@/lib/public-content";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}): Promise<Metadata> {
  const { resourceId } = await params;
  const [resource] = await getDb()
    .select({
      title: resources.title,
      filename: resources.filename,
      description: resources.description,
      coverPath: resources.coverPath,
    })
    .from(resources)
    .where(and(eq(resources.id, resourceId), eq(resources.isPublished, true)))
    .limit(1);
  if (!resource)
    return { title: "Recurso no disponible", robots: { index: false } };
  const title = resource.title || resource.filename;
  const description =
    resource.description?.slice(0, 160) ||
    `Consulta ${title}, sus detalles, descarga y reseñas en la biblioteca de VAMZ.`;
  return {
    title,
    description,
    alternates: { canonical: `/recurso/${resourceId}` },
    openGraph: {
      title,
      description,
      ...(resource.coverPath
        ? { images: [`/api/resources/${resourceId}/cover`] }
        : {}),
    },
  };
}
export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const db = getDb();
  const [resource] = await db
    .select({
      id: resources.id,
      userId: resources.userId,
      filename: resources.filename,
      title: resources.title,
      description: resources.description,
      coverPath: resources.coverPath,
      fileSize: resources.fileSize,
      createdAt: resources.createdAt,
      publishedAt: resources.publishedAt,
      username: users.username,
      email: users.email,
      version: minecraftVersions.version,
      edition: minecraftVersions.edition,
      platform: minecraftVersions.platform,
    })
    .from(resources)
    .innerJoin(users, eq(users.id, resources.userId))
    .leftJoin(minecraftVersions, eq(minecraftVersions.resourceId, resources.id))
    .where(and(eq(resources.id, resourceId), eq(resources.isPublished, true)))
    .limit(1);
  if (!resource) notFound();
  const user = await getCurrentUser();
  const [summary, reviewData, related] = await Promise.all([
    getResourceSummary(resourceId),
    getResourceReviews(resourceId, user?.id),
    db
      .select({
        id: resources.id,
        filename: resources.filename,
        title: resources.title,
        coverPath: resources.coverPath,
        fileSize: resources.fileSize,
        ...engagementColumns,
      })
      .from(resources)
      .where(and(eq(resources.isPublished, true), ne(resources.id, resourceId)))
      .orderBy(desc(resources.publishedAt))
      .limit(3),
  ]);
  const title =
    resource.title?.trim() ||
    (resource.version ? "Minecraft " + resource.version : resource.filename);
  const author = getDisplayUsername(resource.username, resource.email);
  return (
    <PublicFrame>
      <main id="contenido" className="page-shell resource-detail-page">
        <nav className="breadcrumbs" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link>
          <span>/</span>
          <Link href={resource.version ? "/minecraft" : "/recursos"}>
            {resource.version ? "Minecraft" : "Recursos"}
          </Link>
          <span>/</span>
          <span aria-current="page">{title}</span>
        </nav>
        <div className="resource-detail-layout">
          <div className="resource-detail-main">
            <div className="resource-detail-cover">
              <ResourceThumb resource={resource} optimize />
              <span className="detail-cover-tag">
                {resource.edition || getResourceKind(resource.filename)}
              </span>
            </div>
            <div className="resource-title-row">
              <div className="creator-avatar">
                <Image
                  src="/vamz-character.webp"
                  alt=""
                  width={42}
                  height={42}
                  sizes="42px"
                />
              </div>
              <div>
                <span className="resource-byline">Publicado por {author}</span>
                <h1>{title}</h1>
              </div>
            </div>
            <ResourceMetrics {...summary} />
            <section className="resource-description-section">
              <h2>Acerca de este recurso</h2>
              <p>
                {resource.description?.trim() ||
                  "El autor todavía no ha añadido una descripción. Revisa el formato y la información de descarga antes de instalarlo en tu dispositivo."}
              </p>
            </section>
            <section className="resource-file-section">
              <UiIcon name="folder" />
              <div>
                <strong>Archivo incluido</strong>
                <span>{resource.filename}</span>
              </div>
              <span className="file-extension">
                {getFileExtension(resource.filename).toUpperCase() || "ARCHIVO"}
              </span>
            </section>
          </div>
          <aside className="resource-download-panel">
            <div className="download-panel-title">
              <span className="download-panel-icon">
                <UiIcon name="download" />
              </span>
              <div>
                <p>
                  {resource.version
                    ? "Minecraft " + resource.version
                    : "Listo para descargar"}
                </p>
                <h2>Hazlo parte de tu mundo.</h2>
              </div>
            </div>
            <dl className="download-facts">
              <div>
                <dt>Tamaño</dt>
                <dd>{formatBytes(resource.fileSize)}</dd>
              </div>
              <div>
                <dt>Formato</dt>
                <dd>
                  {getFileExtension(resource.filename).toUpperCase() ||
                    "Archivo"}
                </dd>
              </div>
              {resource.platform ? (
                <div>
                  <dt>Dispositivo</dt>
                  <dd>{resource.platform}</dd>
                </div>
              ) : null}
              {resource.edition ? (
                <div>
                  <dt>Edición</dt>
                  <dd>{resource.edition}</dd>
                </div>
              ) : null}
              <div>
                <dt>Publicado</dt>
                <dd>
                  {formatResourceDate(
                    resource.publishedAt ?? resource.createdAt,
                  )}
                </dd>
              </div>
            </dl>
            <DownloadSwitchButton
              href={"/api/resources/" + resource.id + "?download=1"}
              filename={resource.filename}
            />
            <div className="download-help">
              <UiIcon name="folder" />
              <p>
                Guarda el archivo antes de abrirlo. Si incluye instrucciones de
                instalación, revísalas para tu versión de Minecraft.
              </p>
            </div>
            <a className="text-link" href="#resenas">
              <UiIcon name="message" />
              Ver reseñas de la comunidad
            </a>
          </aside>
        </div>
        <ResourceReviews
          key={resource.id}
          resourceId={resource.id}
          initialSummary={summary}
          initialReviews={reviewData.reviews}
          ownReview={reviewData.ownReview}
          loggedIn={Boolean(user)}
          canReview={user?.id !== resource.userId}
        />
        {related.length ? (
          <section className="related-section">
            <div className="detail-section-heading">
              <div>
                <p className="section-kicker">Sigue explorando</p>
                <h2>También puede gustarte</h2>
              </div>
              <Link href="/recursos" className="text-link">
                Ver biblioteca <UiIcon name="arrow" />
              </Link>
            </div>
            <div className="public-resource-grid">
              {related.map((item) => (
                <article key={item.id} className="resource-card">
                  <Link
                    href={"/recurso/" + item.id}
                    className="resource-card-link"
                  >
                    <div className="resource-card-media">
                      <ResourceThumb resource={item} optimize />
                    </div>
                    <div className="resource-card-copy">
                      <h3>{item.title || item.filename}</h3>
                      <p>
                        {getResourceKind(item.filename)} ·{" "}
                        {formatBytes(item.fileSize)}
                      </p>
                      <ResourceMetrics {...item} />
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </PublicFrame>
  );
}
