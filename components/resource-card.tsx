import Link from "next/link";
import { ResourceThumb } from "@/components/resource-thumb";
import { ResourceMetrics } from "@/components/resource-metrics";
import { UiIcon } from "@/components/ui-icon";
import { formatBytes, getResourceKind } from "@/lib/resource-utils";
import type { CatalogResource } from "@/components/resource-catalog";
const publishedDate = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
export function ResourceCard({ resource }: { resource: CatalogResource }) {
  return (
    <article className="resource-card">
      <Link
        className="resource-card-link"
        href={`/recurso/${resource.id}`}
        prefetch={false}
      >
        <div className="resource-card-media">
          <ResourceThumb resource={resource} optimize />
          <span className="resource-kind">
            {getResourceKind(resource.filename)}
          </span>
          <span className="resource-open">
            <UiIcon name="external" />
          </span>
        </div>
        <div className="resource-card-copy">
          <div className="resource-card-meta">
            <span>{formatBytes(resource.fileSize)}</span>
            <time dateTime={resource.publishedAt ?? resource.createdAt}>
              {publishedDate.format(
                new Date(resource.publishedAt ?? resource.createdAt),
              )}
            </time>
          </div>
          <h3>{resource.title?.trim() || resource.filename}</h3>
          <p>{resource.description?.trim() || `Por ${resource.author}`}</p>
          <ResourceMetrics {...resource} />
          <span className="resource-card-action">
            Ver recurso <UiIcon name="arrow" />
          </span>
        </div>
      </Link>
    </article>
  );
}
