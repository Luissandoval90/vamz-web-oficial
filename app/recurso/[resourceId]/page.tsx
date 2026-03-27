import Link from "next/link";
import { and, desc, eq, ne } from "drizzle-orm";
import { notFound } from "next/navigation";

import { DownloadSwitchButton } from "@/components/download-switch-button";
import { ResourceThumb } from "@/components/resource-thumb";
import { PublicPageShell } from "@/components/public-page-shell";
import { getDb } from "@/db";
import { resources, users } from "@/db/schema";
import {
  formatBytes,
  formatResourceDate,
  getFileExtension,
  getResourceKind,
  imageExtensions,
} from "@/lib/resource-utils";
import { getDisplayUsername } from "@/lib/usernames";

export const dynamic = "force-dynamic";

type ResourcePageProps = {
  params: Promise<{
    resourceId: string;
  }>;
};

export default async function ResourceDetailPage({ params }: ResourcePageProps) {
  const { resourceId } = await params;
  const db = getDb();

  const [resource] = await db
    .select({
      id: resources.id,
      filename: resources.filename,
      title: resources.title,
      description: resources.description,
      coverPath: resources.coverPath,
      fileSize: resources.fileSize,
      createdAt: resources.createdAt,
      publishedAt: resources.publishedAt,
      username: users.username,
      email: users.email,
    })
    .from(resources)
    .innerJoin(users, eq(users.id, resources.userId))
    .where(and(eq(resources.id, resourceId), eq(resources.isPublished, true)))
    .limit(1);

  if (!resource) {
    notFound();
  }

  const relatedResources = await db
    .select({
      id: resources.id,
      filename: resources.filename,
      title: resources.title,
      coverPath: resources.coverPath,
      fileSize: resources.fileSize,
    })
    .from(resources)
    .where(and(eq(resources.isPublished, true), ne(resources.id, resource.id)))
    .orderBy(desc(resources.publishedAt), desc(resources.createdAt))
    .limit(3);

  const resourceTitle = resource.title?.trim() || resource.filename;
  const resourceAuthor = getDisplayUsername(resource.username, resource.email);
  const publishedOn = resource.publishedAt ?? resource.createdAt;
  const resourceKind = getResourceKind(resource.filename);
  const previewUrl = resource.coverPath
    ? `/api/resources/${resource.id}/cover`
    : imageExtensions.has(getFileExtension(resource.filename))
      ? `/api/resources/${resource.id}`
      : "/rem3.jpg";

  return (
    <PublicPageShell
      active="resources"
      subtitle="Recurso"
      title={resourceTitle}
      description="Descarga el recurso y revisa toda su informacion desde esta pagina."
      imageSrc={previewUrl}
      imageAlt={resourceTitle}
      heroFooter={
        <div className="hero-tags">
          <span className="tag-chip">{resourceKind}</span>
          <span className="tag-chip">{formatBytes(resource.fileSize)}</span>
          <span className="tag-chip">{resourceAuthor}</span>
        </div>
      }
    >
      <article className="panel-card feature-panel resource-detail-summary-card">
        <div className="section-heading">
          <p className="section-kicker">Informacion</p>
          <h2 className="section-title-sm">Detalles del recurso</h2>
        </div>

        <div className="resource-detail-meta-grid">
          <article className="resource-detail-meta-card">
            <span className="resource-detail-meta-label">Tipo</span>
            <strong>{resourceKind}</strong>
          </article>
          <article className="resource-detail-meta-card">
            <span className="resource-detail-meta-label">Peso</span>
            <strong>{formatBytes(resource.fileSize)}</strong>
          </article>
          <article className="resource-detail-meta-card">
            <span className="resource-detail-meta-label">Publicado</span>
            <strong>{formatResourceDate(publishedOn)}</strong>
          </article>
          <article className="resource-detail-meta-card">
            <span className="resource-detail-meta-label">Autor</span>
            <strong>{resourceAuthor}</strong>
          </article>
        </div>

        <div className="resource-detail-description-box">
          <p className="resource-detail-description">
            {resource.description?.trim() || "Este recurso no tiene descripcion todavia."}
          </p>
        </div>
      </article>

      <article className="panel-card feature-panel resource-detail-actions-card">
        <div className="section-heading">
          <p className="section-kicker">Descarga</p>
          <h2 className="section-title-sm">Descargar recurso</h2>
        </div>

        <div className="resource-detail-preview">
          <div className="resource-detail-thumb">
            <ResourceThumb resource={resource} previewUrl={previewUrl} />
          </div>
        </div>

        <div className="resource-detail-action-list">
          <DownloadSwitchButton
            href={`/api/resources/${resource.id}?download=1`}
            filename={resource.filename}
          />
        </div>
      </article>

      {relatedResources.length > 0 ? (
        <article className="panel-card library-panel resource-related-panel">
          <div className="section-heading">
            <p className="section-kicker">Mas recursos</p>
            <h2 className="section-title-sm">Sigue explorando</h2>
          </div>

          <div className="resource-related-grid">
            {relatedResources.map((item) => {
              const itemTitle = item.title?.trim() || item.filename;

              return (
                <Link className="resource-related-card" href={`/recurso/${item.id}`} key={item.id}>
                  <div className="resource-related-thumb">
                    <ResourceThumb resource={item} />
                  </div>
                  <div className="resource-related-copy">
                    <p className="resource-related-title">{itemTitle}</p>
                    <span className="resource-related-meta">
                      {getResourceKind(item.filename)} · {formatBytes(item.fileSize)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </article>
      ) : null}
    </PublicPageShell>
  );
}
