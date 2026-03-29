"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ResourceThumb } from "@/components/resource-thumb";
import {
  formatBytes,
  formatResourceDate,
  getResourceDisplayTitle,
  getResourceKind,
} from "@/lib/resource-utils";

type LibraryResource = {
  id: string;
  filename: string;
  path: string;
  title: string | null;
  description: string | null;
  coverPath: string | null;
  fileSize: number;
  coverSize: number;
  totalSize: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
};

type ResourceLibraryProps = {
  resources: LibraryResource[];
  kicker?: string;
  title?: string;
  description?: string;
  emptyStateCopy?: string;
  showSearch?: boolean;
  showEditControls?: boolean;
  className?: string;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ResourceEditorCard({
  resource,
  showEditControls,
}: {
  resource: LibraryResource;
  showEditControls: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(resource.title ?? "");
  const [description, setDescription] = useState(resource.description ?? "");
  const [removeCover, setRemoveCover] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"save" | "delete" | null>(null);
  const [, startTransition] = useTransition();

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFeedback(null);
    setBusyAction("save");

    const formData = new FormData(event.currentTarget);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("removeCover", String(removeCover));

    const response = await fetch(`/api/resources/${resource.id}/details`, {
      method: "POST",
      body: formData,
    });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(result?.error ?? "No se pudo actualizar el recurso.");
      setBusyAction(null);
      return;
    }

    setFeedback("Cambios guardados.");
    setBusyAction(null);
    setIsEditing(false);
    refresh();
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Se eliminara este recurso del panel y de la parte publica. Quieres continuar?",
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setFeedback(null);
    setBusyAction("delete");

    const response = await fetch(`/api/resources/${resource.id}`, {
      method: "DELETE",
    });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(result?.error ?? "No se pudo eliminar el recurso.");
      setBusyAction(null);
      return;
    }

    refresh();
  };

  const saveBusy = busyAction === "save";
  const deleteBusy = busyAction === "delete";

  return (
    <article className={`resource-row resource-row-advanced ${isEditing ? "is-editing" : ""}`}>
      <div className="resource-thumb resource-thumb-lg">
        <ResourceThumb resource={resource} />
      </div>

      <div className="resource-main resource-main-advanced">
        <div className="resource-header">
          <div className="resource-title-wrap">
            <p className="resource-name">
              {getResourceDisplayTitle(resource.title, resource.filename)}
            </p>
            <p className="resource-copy resource-copy-compact">{resource.filename}</p>
          </div>
          <div className="resource-badges">
            <span className={`status-chip ${resource.isPublished ? "is-ok" : "is-muted"}`}>
              {resource.isPublished ? "Publicado" : "Privado"}
            </span>
            <span className="status-chip is-muted">{getResourceKind(resource.filename)}</span>
          </div>
        </div>

          <div className="resource-details-grid">
          <p className="resource-copy">
            {resource.description?.trim() || "Este recurso todavia no tiene descripcion."}
          </p>
          <div className="resource-meta-stack">
            <span>{formatBytes(resource.totalSize)}</span>
            <span>
              {resource.isPublished && resource.publishedAt
                ? `Publicado: ${formatResourceDate(resource.publishedAt)}`
                : `Guardado: ${formatResourceDate(resource.createdAt)}`}
            </span>
            <span>{resource.path}</span>
          </div>
        </div>

        <div className="row-actions">
          {showEditControls ? (
            <button
              className="action-button is-ghost-light"
              type="button"
              onClick={() => {
                setIsEditing((current) => !current);
                setFeedback(null);
                setError(null);
              }}
            >
              {isEditing ? "Cerrar" : "Editar"}
            </button>
          ) : null}
          {showEditControls ? (
            <button
              className="action-button is-dark"
              type="button"
              disabled={deleteBusy}
              onClick={handleDelete}
            >
              {deleteBusy ? "Eliminando..." : "Eliminar"}
            </button>
          ) : null}
        </div>

        {feedback ? <p className="status-text is-ok">{feedback}</p> : null}
        {error ? <p className="status-text is-error">{error}</p> : null}

        {showEditControls && isEditing ? (
          <form className="resource-editor" onSubmit={handleSave}>
            <div className="resource-editor-grid">
              <label className="field" htmlFor={`resource-title-${resource.id}`}>
                <span className="field-label">Nombre visible</span>
                <input
                  id={`resource-title-${resource.id}`}
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  placeholder="Nombre del recurso"
                />
              </label>

              <label className="field resource-editor-full" htmlFor={`resource-description-${resource.id}`}>
                <span className="field-label">Descripcion</span>
                <textarea
                  id={`resource-description-${resource.id}`}
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={600}
                  placeholder="Cuenta que incluye este recurso o para que sirve."
                />
              </label>

              <label className="field" htmlFor={`resource-cover-${resource.id}`}>
                <span className="field-label">Cambiar portada</span>
                <input
                  id={`resource-cover-${resource.id}`}
                  type="file"
                  name="cover"
                  accept="image/*"
                />
              </label>

              <label className="field checkbox-field" htmlFor={`resource-remove-cover-${resource.id}`}>
                <input
                  id={`resource-remove-cover-${resource.id}`}
                  type="checkbox"
                  checked={removeCover}
                  onChange={(event) => setRemoveCover(event.target.checked)}
                />
                <span>Quitar la portada actual</span>
              </label>
            </div>

            <div className="inline-actions">
              <button className="action-button is-accent" type="submit" disabled={saveBusy}>
                {saveBusy ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </article>
  );
}

export function ResourceLibrary({
  resources,
  kicker = "Biblioteca",
  title = "Todos tus recursos",
  description = "Edita el nombre, la descripcion y la portada de cada recurso antes de publicarlo.",
  emptyStateCopy = "Todavia no hay recursos cargados.",
  showSearch = true,
  showEditControls = true,
  className = "",
}: ResourceLibraryProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const term = normalize(deferredSearch);
  const filteredResources = !term
    ? resources
    : resources.filter((resource) =>
        normalize(
          `${resource.filename} ${resource.path} ${resource.title ?? ""} ${
            resource.description ?? ""
          } ${getResourceKind(resource.filename)}`,
        ).includes(term),
      );

  return (
    <article
      className={`panel-card dashboard-panel-card resource-library-panel ${className}`.trim()}
    >
      {showSearch ? (
        <div className="site-search resource-search">
          <button className="site-search-trigger" type="button" aria-label="Buscar recursos">
            <SearchIcon />
          </button>
          <div className="site-search-field">
            <input
              aria-label="Buscar recursos"
              placeholder="Buscar por nombre, descripcion, archivo o ruta..."
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      ) : null}

      <div className="section-heading">
        <p className="section-kicker">{kicker}</p>
        <h2 className="section-title-sm">{title}</h2>
        <p className="body-copy">{description}</p>
      </div>

      {filteredResources.length === 0 ? (
        <div className="empty-box">{emptyStateCopy}</div>
      ) : (
        <div className="resource-list resource-list-advanced">
          {filteredResources.map((resource) => (
            <ResourceEditorCard
              key={resource.id}
              resource={resource}
              showEditControls={showEditControls}
            />
          ))}
        </div>
      )}
    </article>
  );
}
