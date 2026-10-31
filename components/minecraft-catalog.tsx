"use client";

import { useDeferredValue, useState } from "react";
import { formatBytes, formatResourceDate } from "@/lib/resource-utils";
import { UiIcon } from "@/components/ui-icon";
import Link from "next/link";
import {
  ResourceMetrics,
  type ResourceMetricsData,
} from "@/components/resource-metrics";
import { ResourceThumb } from "@/components/resource-thumb";

type MinecraftDownload = Partial<ResourceMetricsData> & {
  id: string;
  filename: string;
  title: string | null;
  description: string | null;
  fileSize: number;
  createdAt: string;
  publishedAt: string | null;
  version: string;
  edition: string;
  platform: string;
  coverPath?: string | null;
};

export function MinecraftCatalog({
  versions,
}: {
  versions: MinecraftDownload[];
}) {
  const [search, setSearch] = useState("");
  const [edition, setEdition] = useState("Todas");
  const [platform, setPlatform] = useState("Todas");
  const [page, setPage] = useState(1);
  const query = useDeferredValue(search).trim().toLowerCase();
  const filtered = versions.filter(
    (item) =>
      (edition === "Todas" || item.edition === edition) &&
      (platform === "Todas" || item.platform === platform) &&
      `${item.version} ${item.title ?? ""} ${item.platform} ${item.edition}`
        .toLowerCase()
        .includes(query),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  const current = Math.min(page, pages);
  return (
    <section aria-label="Versiones de Minecraft">
      <div className="minecraft-filters">
        <label className="field">
          <span className="field-label">Buscar versión</span>
          <input
            type="search"
            name="version-search"
            placeholder="Ej. 1.21…"
            autoComplete="off"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="field">
          <span className="field-label">Edición</span>
          <select
            value={edition}
            onChange={(event) => {
              setEdition(event.target.value);
              setPage(1);
            }}
          >
            <option>Todas</option>
            <option>Bedrock</option>
            <option>Java</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Plataforma</span>
          <select
            value={platform}
            onChange={(event) => {
              setPlatform(event.target.value);
              setPage(1);
            }}
          >
            <option>Todas</option>
            <option>Android</option>
            <option>Windows</option>
            <option>macOS</option>
            <option>Linux</option>
            <option>Multiplataforma</option>
          </select>
        </label>
      </div>
      <p className="section-description" role="status">
        {filtered.length}{" "}
        {filtered.length === 1 ? "versión disponible" : "versiones disponibles"}
      </p>
      {filtered.length ? (
        <div className="minecraft-download-grid">
          {filtered.slice((current - 1) * 12, current * 12).map((item) => (
            <article className="minecraft-download-card" key={item.id}>
              <Link
                className="minecraft-card-cover"
                href={`/recurso/${item.id}`}
              >
                <ResourceThumb resource={item} optimize />
              </Link>
              <div className="minecraft-download-heading">
                <span className="minecraft-edition">{item.edition}</span>
                <span className="status-chip is-muted">{item.platform}</span>
              </div>
              <h2>
                Minecraft <span className="text-accent">{item.version}</span>
              </h2>
              {item.title ? (
                <p className="minecraft-download-title">{item.title}</p>
              ) : null}
              <p className="minecraft-download-description">
                {item.description ||
                  "Selecciona la descarga compatible con tu dispositivo."}
              </p>
              <div className="minecraft-download-meta">
                <span>{formatBytes(item.fileSize)}</span>
                <time dateTime={item.publishedAt ?? item.createdAt}>
                  {formatResourceDate(item.publishedAt ?? item.createdAt)}
                </time>
              </div>
              <ResourceMetrics {...item} />
              <Link
                className="action-button is-accent"
                href={`/recurso/${item.id}`}
                aria-label={`Ver Minecraft ${item.version}, ${item.edition}, ${item.platform}`}
              >
                Ver versión y descargar <UiIcon name="arrow" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="catalog-empty">
          <h2>
            {versions.length
              ? "No encontramos esa versión."
              : "Las próximas versiones aparecerán aquí."}
          </h2>
          <p>
            {versions.length
              ? "Prueba otro número de versión o cambia los filtros."
              : "El administrador todavía no ha publicado archivos de Minecraft."}
          </p>
        </div>
      )}
      {pages > 1 ? (
        <nav className="minecraft-pagination" aria-label="Páginas de versiones">
          <button
            className="action-button is-dark"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            Anterior
          </button>
          <span aria-live="polite">
            {current} / {pages}
          </span>
          <button
            className="action-button is-dark"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            Siguiente
          </button>
        </nav>
      ) : null}
    </section>
  );
}
