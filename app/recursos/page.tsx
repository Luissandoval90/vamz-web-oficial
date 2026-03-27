import Link from "next/link";

import { desc, eq } from "drizzle-orm";

import { ResourceThumb } from "@/components/resource-thumb";
import { PublicPageShell } from "@/components/public-page-shell";
import { getDb } from "@/db";
import { resources, users } from "@/db/schema";
import { formatBytes, getResourceKind } from "@/lib/resource-utils";
import { getDisplayUsername } from "@/lib/usernames";

export const dynamic = "force-dynamic";

const resourceDateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
});

export default async function RecursosPage() {
  const db = getDb();
  const publishedResources = await db
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
    .where(eq(resources.isPublished, true))
    .orderBy(desc(resources.publishedAt), desc(resources.createdAt));

  return (
    <PublicPageShell
      active="resources"
      subtitle="Recursos"
      title="Biblioteca publica del proyecto."
      description="Aqui aparecen los recursos que se publican desde el panel para que cualquiera pueda abrirlos y revisarlos."
      imageSrc="/rem3.jpg"
      imageAlt="Recursos"
      heroFooter={
        <div className="hero-tags">
          <span className="tag-chip">Publico</span>
          <span className="tag-chip">Descargas</span>
          <span className="tag-chip">Biblioteca</span>
        </div>
      }
    >
      {publishedResources.length > 0 ? (
        <article className="panel-card library-panel animate-up delay-1">
          <div className="section-heading">
            <p className="section-kicker">Biblioteca publica</p>
            <h2 className="section-title-sm">Recursos visibles para todos</h2>
          </div>

          <div className="public-resource-grid">
            {publishedResources.map((resource) => {
              const publishedOn = resource.publishedAt ?? resource.createdAt;
              const resourceTitle = resource.title?.trim() || resource.filename;
              const resourceAuthor = getDisplayUsername(resource.username, resource.email);

              return (
                <article className="resource-spotlight-card" key={resource.id}>
                  <Link
                    className="resource-spotlight-link"
                    href={`/recurso/${resource.id}`}
                    aria-label={`Abrir ${resourceTitle}`}
                  >
                    <div className="resource-spotlight-media">
                      <div className="resource-spotlight-cover">
                        <ResourceThumb resource={resource} />
                      </div>

                      <div className="resource-spotlight-top">
                        <span className="resource-spotlight-chip is-status">Publicado</span>
                        <span className="resource-spotlight-chip is-size">
                          {formatBytes(resource.fileSize)}
                        </span>
                      </div>
                    </div>

                    <div className="resource-spotlight-body">
                      <div className="resource-spotlight-main">
                        <div className="resource-spotlight-title-row">
                          <p className="resource-spotlight-title">{resourceTitle}</p>
                          <span className="resource-spotlight-open" aria-hidden="true">
                            ↗
                          </span>
                        </div>
                        <p className="resource-spotlight-author">Por {resourceAuthor}</p>
                      </div>

                      <div className="resource-spotlight-foot">
                        <div className="resource-spotlight-rating">
                          <span className="resource-spotlight-star" aria-hidden="true">
                            ★
                          </span>
                          <span>{resourceDateFormatter.format(new Date(publishedOn))}</span>
                        </div>
                        <span className="resource-spotlight-type">
                          {getResourceKind(resource.filename)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </article>
      ) : null}
    </PublicPageShell>
  );
}
