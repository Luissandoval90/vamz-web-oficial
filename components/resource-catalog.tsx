"use client";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ResourceCard } from "@/components/resource-card";
import { UiIcon } from "@/components/ui-icon";
import { type ResourceMetricsData } from "@/components/resource-metrics";
import {
  imageExtensions,
  archiveExtensions,
  getFileExtension,
} from "@/lib/resource-utils";

export type CatalogResource = Partial<ResourceMetricsData> & {
  id: string;
  filename: string;
  title: string | null;
  description: string | null;
  coverPath: string | null;
  fileSize: number;
  createdAt: string;
  publishedAt: string | null;
  author: string;
};
const categories = [
  "Todos",
  "Imágenes",
  "Packs y archivos",
  "Documentos",
  "Otros",
];
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const categoryFor = (filename: string) => {
  const ext = getFileExtension(filename);
  return imageExtensions.has(ext)
    ? "Imágenes"
    : archiveExtensions.has(ext)
      ? "Packs y archivos"
      : ext === "pdf"
        ? "Documentos"
        : "Otros";
};

export function ResourceCatalog({
  resources,
  compact = false,
  initialSearch = "",
  initialCategory = "all",
}: {
  resources: CatalogResource[];
  compact?: boolean;
  initialSearch?: string;
  initialCategory?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const categoryKeys = ["all", "images", "packs", "documents", "other"];
  const [category, setCategory] = useState(
    categories[Math.max(0, categoryKeys.indexOf(initialCategory))],
  );
  const [sort, setSort] = useState("recent");
  const [visibleCount, setVisibleCount] = useState(24);
  const query = normalize(useDeferredValue(search).trim());
  const filtered = resources.filter(
    (item) =>
      (category === "Todos" || categoryFor(item.filename) === category) &&
      normalize(
        `${item.title ?? ""} ${item.description ?? ""} ${item.filename}`,
      ).includes(query),
  );
  const sorted = [...filtered].sort((a, b) =>
    sort === "popular"
      ? (b.views ?? 0) - (a.views ?? 0)
      : sort === "rating"
        ? (b.rating ?? 0) - (a.rating ?? 0)
        : sort === "name"
          ? (a.title || a.filename).localeCompare(b.title || b.filename, "es")
          : sort === "size"
            ? a.fileSize - b.fileSize
            : (b.publishedAt || b.createdAt).localeCompare(
                a.publishedAt || a.createdAt,
              ),
  );

  return (
    <div className="catalog">
      {!compact ? (
        <>
          <div className="catalog-toolbar">
            <div className="catalog-search">
              <UiIcon name="search" />
              <input
                type="search"
                name="q"
                autoComplete="off"
                aria-label="Buscar recursos"
                placeholder="Busca tu próximo recurso…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearch("")}
                >
                  <UiIcon name="close" />
                </button>
              ) : null}
            </div>
            <label className="catalog-sort">
              <span>Ordenar por</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Ordenar recursos"
              >
                <option value="recent">Más recientes</option>
                <option value="popular">Más vistos</option>
                <option value="rating">Mejor valorados</option>
                <option value="name">Nombre: A a Z</option>
                <option value="size">Menor tamaño</option>
              </select>
            </label>
          </div>
          <div className="catalog-filter-row">
            <div
              className="catalog-filters"
              role="group"
              aria-label="Filtrar por tipo"
            >
              {categories.map((item) => (
                <button
                  className={category === item ? "is-active" : ""}
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <span className="catalog-count" role="status">
              {filtered.length} {filtered.length === 1 ? "recurso" : "recursos"}
            </span>
          </div>
        </>
      ) : null}
      {sorted.length ? (
        <>
          <div className="public-resource-grid">
            {sorted.slice(0, visibleCount).map((resource) => (
              <ResourceCard resource={resource} key={resource.id} />
            ))}
          </div>
          {sorted.length > visibleCount ? (
            <div className="catalog-more">
              <button
                className="action-button is-dark"
                type="button"
                onClick={() => setVisibleCount((current) => current + 24)}
              >
                Cargar más recursos <UiIcon name="arrow" />
              </button>
              <p role="status">
                Mostrando {visibleCount} de {sorted.length}
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="catalog-empty">
          <span className="empty-icon">
            <UiIcon name={resources.length ? "search" : "folder"} />
          </span>
          <h3>
            {resources.length
              ? "No encontramos coincidencias."
              : "Lo próximo está por llegar."}
          </h3>
          <p>
            {resources.length
              ? "Prueba con otro nombre o cambia los filtros de búsqueda."
              : "Los nuevos recursos aparecerán aquí en cuanto estén publicados. Mientras tanto, nos vemos en la comunidad."}
          </p>
          {resources.length ? (
            <button
              className="action-button is-dark"
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("Todos");
              }}
            >
              Limpiar filtros <UiIcon name="close" />
            </button>
          ) : (
            <Link className="text-link" href="/#comunidad">
              Explorar la comunidad <UiIcon name="arrow" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
