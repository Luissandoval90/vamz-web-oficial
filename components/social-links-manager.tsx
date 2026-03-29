"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  getSocialLinkBadge,
  getSocialLinkDisplayName,
  getSocialLinkHostname,
  SOCIAL_LINK_PLATFORM_OPTIONS,
} from "@/lib/social-links";

type SocialLinkRecord = {
  id: number;
  platform: string;
  url: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
};

type SocialLinksManagerProps = {
  links: SocialLinkRecord[];
};

type LinkFormState = {
  platform: string;
  url: string;
  icon: string;
};

const emptyForm = {
  platform: "",
  url: "",
  icon: "",
};

const socialPlatformOptions = [...SOCIAL_LINK_PLATFORM_OPTIONS];

function SocialLinkItem({ link }: { link: SocialLinkRecord }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<LinkFormState>({
    platform: link.platform,
    url: link.url,
    icon: link.icon,
  });
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"save" | "delete" | null>(null);
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
    setPendingAction("save");

    const response = await fetch(`/api/social-links/${link.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(result?.error ?? "No se pudo actualizar el link.");
      setPendingAction(null);
      return;
    }

    setFeedback("Link actualizado.");
    setPendingAction(null);
    setIsEditing(false);
    refresh();
  };

  const handleDelete = async () => {
    setError(null);
    setFeedback(null);
    setPendingAction("delete");

    const response = await fetch(`/api/social-links/${link.id}`, {
      method: "DELETE",
    });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(result?.error ?? "No se pudo eliminar el link.");
      setPendingAction(null);
      return;
    }

    setPendingAction(null);
    refresh();
  };

  return (
    <article className={`social-link-card ${isEditing ? "is-editing" : ""}`}>
      <div className="social-link-card-head">
        <span className="social-link-badge">{getSocialLinkBadge(link.platform, link.icon)}</span>
        <div className="social-link-copy">
          <p className="social-link-name">{getSocialLinkDisplayName(link.platform)}</p>
          <p className="social-link-url">{getSocialLinkHostname(link.url)}</p>
        </div>
        <div className="row-actions">
          <a
            className="action-button is-light"
            href={link.url}
            target="_blank"
            rel="noreferrer"
          >
            Abrir
          </a>
          <button
            className="action-button is-ghost-light"
            type="button"
            onClick={() => {
              setIsEditing((current) => !current);
              setError(null);
              setFeedback(null);
              setForm({
                platform: link.platform,
                url: link.url,
                icon: link.icon,
              });
            }}
          >
            {isEditing ? "Cerrar" : "Editar"}
          </button>
          <button
            className="action-button is-dark"
            type="button"
            disabled={pendingAction === "delete"}
            onClick={handleDelete}
          >
            {pendingAction === "delete" ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>

      {feedback ? <p className="status-text is-ok">{feedback}</p> : null}
      {error ? <p className="status-text is-error">{error}</p> : null}

      {isEditing ? (
        <form className="social-link-form-grid" onSubmit={handleSave}>
          <label className="field" htmlFor={`social-platform-${link.id}`}>
            <span className="field-label">Red social</span>
            <input
              id={`social-platform-${link.id}`}
              type="text"
              list={`social-platform-options-${link.id}`}
              value={form.platform}
              onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value }))}
              placeholder="TikTok, Discord, Instagram..."
              maxLength={40}
              required
            />
            <datalist id={`social-platform-options-${link.id}`}>
              {socialPlatformOptions.map((platform) => (
                <option key={`${link.id}-${platform}`} value={platform} />
              ))}
            </datalist>
          </label>

          <label className="field" htmlFor={`social-url-${link.id}`}>
            <span className="field-label">Enlace</span>
            <input
              id={`social-url-${link.id}`}
              type="url"
              value={form.url}
              onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
              placeholder="https://..."
              required
            />
          </label>

          <label className="field" htmlFor={`social-icon-${link.id}`}>
            <span className="field-label">Icono corto</span>
            <input
              id={`social-icon-${link.id}`}
              type="text"
              value={form.icon}
              onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
              placeholder="TT o emoji"
              maxLength={8}
            />
          </label>

          <div className="inline-actions">
            <button
              className="action-button is-accent"
              type="submit"
              disabled={pendingAction === "save"}
            >
              {pendingAction === "save" ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      ) : null}
    </article>
  );
}

export function SocialLinksManager({ links }: SocialLinksManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState<LinkFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/social-links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(result?.error ?? "No se pudo crear el link.");
      return;
    }

    setForm(emptyForm);
    setSuccess("Link creado.");
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="dashboard-primary-grid social-links-layout">
      <form className="panel-card social-link-editor-card" onSubmit={handleCreate}>
        <div className="section-heading">
          <p className="section-kicker">Links</p>
          <h2 className="section-title-sm">Crear red social</h2>
          <p className="body-copy">
            Agrega aqui los enlaces que quieres mostrar en la pagina principal.
          </p>
        </div>

        <div className="social-link-form-grid">
          <label className="field" htmlFor="social-platform-new">
            <span className="field-label">Red social</span>
            <input
              id="social-platform-new"
              type="text"
              list="social-platform-options-new"
              value={form.platform}
              onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value }))}
              placeholder="TikTok, Discord, Instagram..."
              maxLength={40}
              required
            />
            <datalist id="social-platform-options-new">
              {socialPlatformOptions.map((platform) => (
                <option key={platform} value={platform} />
              ))}
            </datalist>
          </label>

          <label className="field" htmlFor="social-url-new">
            <span className="field-label">Enlace</span>
            <input
              id="social-url-new"
              type="url"
              value={form.url}
              onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
              placeholder="https://..."
              required
            />
          </label>

          <label className="field" htmlFor="social-icon-new">
            <span className="field-label">Icono corto</span>
            <input
              id="social-icon-new"
              type="text"
              value={form.icon}
              onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
              placeholder="TT o emoji"
              maxLength={8}
            />
          </label>
        </div>

        <div className="social-platform-presets">
          <span className="field-label">Plataformas sugeridas</span>
          <div className="social-platform-preset-list">
            {socialPlatformOptions.map((platform) => (
              <button
                key={platform}
                className={`preset-chip ${form.platform === platform ? "is-active" : ""}`}
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    platform,
                  }))
                }
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        <div className="inline-actions">
          <button className="action-button is-accent" type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Crear link"}
          </button>
        </div>

        {error ? <p className="status-text is-error">{error}</p> : null}
        {success ? <p className="status-text is-ok">{success}</p> : null}
      </form>

      <article className="panel-card dashboard-panel-card library-panel social-links-library">
        <div className="section-heading">
          <p className="section-kicker">Publicados</p>
          <h2 className="section-title-sm">Tus links</h2>
          <p className="body-copy">
            Edita o elimina los enlaces que ya aparecen publicados en el inicio.
          </p>
        </div>

        {links.length === 0 ? (
          <div className="empty-box">Todavia no has agregado enlaces.</div>
        ) : (
          <div className="social-links-list">
            {links.map((link) => (
              <SocialLinkItem key={link.id} link={link} />
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
