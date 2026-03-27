"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { formatBytes } from "@/lib/resource-utils";

const formatUsagePercent = (value: number) => {
  if (value <= 0) {
    return "0%";
  }

  if (value < 0.01) {
    return "<0.01%";
  }

  if (value < 1) {
    return `${value.toFixed(2)}%`;
  }

  return `${value.toFixed(1)}%`;
};

const getVisibleUsageWidth = (value: number) => {
  if (value <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(value, 4));
};

type UploadFormProps = {
  kicker?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  successMessage?: string;
  publishOnUpload?: boolean;
  storage?: {
    limitBytes: number;
    usedBytes: number;
    availableBytes: number;
    usagePercent: number;
  };
};

export function UploadForm({
  kicker = "Recursos",
  title = "Agregar recurso",
  description = "Sube el archivo principal, una portada opcional y el texto con el que quieres publicarlo.",
  submitLabel = "Subir",
  successMessage = "Archivo subido.",
  publishOnUpload = false,
  storage,
}: UploadFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [coverName, setCoverName] = useState("");
  const [fileName, setFileName] = useState("");
  const [isPending, startTransition] = useTransition();
  const formattedUsagePercent = storage ? formatUsagePercent(storage.usagePercent) : "0%";
  const visibleUsageWidth = storage ? getVisibleUsageWidth(storage.usagePercent) : 0;
  const storageLocked = Boolean(storage && storage.availableBytes <= 0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);

    if (publishOnUpload) {
      formData.set("publish", "true");
    }

    const response = await fetch("/api/resources/upload", {
      method: "POST",
      body: formData,
    });

    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(result?.error ?? "No se pudo subir el archivo.");
      return;
    }

    formRef.current?.reset();
    setSuccess(successMessage);
    setCoverName("");
    setFileName("");

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <form ref={formRef} className="panel-card upload-card upload-card-lg" onSubmit={handleSubmit}>
      <div className="upload-card-head">
        <div className="section-heading">
          <p className="section-kicker">{kicker}</p>
          <h2 className="section-title-sm">{title}</h2>
          <p className="body-copy">{description}</p>
        </div>

        <div className="upload-card-badges" aria-hidden="true">
          <span className="upload-card-badge is-accent">Publicacion automatica</span>
          <span className="upload-card-badge">Recurso publico</span>
          <span className="upload-card-badge">Panel admin</span>
        </div>
      </div>

      {storage ? (
        <section className="storage-panel upload-storage-panel" aria-label="Resumen de almacenamiento">
          <div className="storage-grid">
            <article className="subtle-card">
              <p className="section-kicker">Total</p>
              <h3 className="section-title-sm">{formatBytes(storage.limitBytes)}</h3>
            </article>
            <article className="subtle-card">
              <p className="section-kicker">Ocupado</p>
              <h3 className="section-title-sm">{formatBytes(storage.usedBytes)}</h3>
            </article>
            <article className="subtle-card">
              <p className="section-kicker">Disponible</p>
              <h3 className="section-title-sm">{formatBytes(storage.availableBytes)}</h3>
            </article>
          </div>

          <div className="storage-progress">
            <div className="storage-progress-copy">
              <div className="storage-progress-copy-text">
                <span>Uso de Cloudflare R2</span>
                <small>
                  {storage.availableBytes > 0
                    ? `Te quedan ${formatBytes(storage.availableBytes)} libres`
                    : "Has llegado al limite configurado del almacenamiento"}
                </small>
              </div>
              <strong>{formattedUsagePercent}</strong>
            </div>
            <div
              className="storage-progress-bar"
              role="progressbar"
              aria-label="Uso de Cloudflare R2"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Number(storage.usagePercent.toFixed(4))}
              aria-valuetext={`${formatBytes(storage.usedBytes)} usados de ${formatBytes(
                storage.limitBytes,
              )}`}
            >
              <span
                className="storage-progress-fill"
                style={{
                  width: `${visibleUsageWidth}%`,
                }}
              />
            </div>
            <div className="storage-progress-meta" aria-hidden="true">
              <span>{formatBytes(storage.usedBytes)} usados</span>
              <strong>
                {formatBytes(storage.usedBytes)} / {formatBytes(storage.limitBytes)}
              </strong>
            </div>
          </div>
        </section>
      ) : null}

      <div className="form-grid upload-meta-grid">
        <label className="field" htmlFor="resource-title">
          <span className="field-label">Nombre del recurso</span>
          <input
            id="resource-title"
            name="title"
            type="text"
            placeholder="Ej. Pack de texturas V2"
            maxLength={120}
          />
        </label>

        <label className="field" htmlFor="resource-description">
          <span className="field-label">Descripcion</span>
          <textarea
            id="resource-description"
            name="description"
            rows={5}
            placeholder="Describe para que sirve el recurso, que incluye o como se usa."
          />
        </label>
      </div>

      <div className="upload-assets-grid">
        <label className="field" htmlFor="resource-cover">
          <span className="field-label">Portada</span>
          <div className="upload-box upload-box-secondary">
            <div className="upload-box-head">
              <div className="upload-copy">
                <strong>Sube una imagen opcional para representarlo</strong>
                <p>Se usara como portada publica.</p>
              </div>
              <span className="upload-box-chip">Opcional</span>
            </div>

            <div className="upload-box-foot">
              <span className="upload-file-state">
                {coverName || "Sin portada seleccionada"}
              </span>
              <input
                className="file-input"
                id="resource-cover"
                type="file"
                name="cover"
                accept="image/*"
                onChange={(event) => setCoverName(event.target.files?.[0]?.name ?? "")}
              />
            </div>
          </div>
        </label>

        <label className="field" htmlFor="resource-upload">
          <span className="field-label">Archivo principal</span>
          <div className="upload-box upload-box-featured">
            <div className="upload-box-head">
              <div className="upload-copy">
                <strong>Selecciona el archivo que quieres subir</strong>
                <p>Quedara listo para publicarse.</p>
              </div>
              <span className="upload-box-chip is-strong">Principal</span>
            </div>

            <div className="upload-box-foot">
              <span className="upload-file-state">{fileName || "Ningun archivo seleccionado"}</span>
              <input
                className="file-input file-input-lg"
                id="resource-upload"
                type="file"
                name="file"
                required
                onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
              />
            </div>
          </div>
        </label>
      </div>

      <div className="upload-submit-strip">
        <div className="upload-submit-copy">
          <p className="upload-submit-title">Listo para publicar</p>
          <span className="inline-note">
            {storageLocked
              ? "No puedes subir mas archivos hasta liberar espacio."
              : "Se bloquearan nuevas subidas al llegar al limite configurado."}
          </span>
        </div>

        <button className="action-button is-accent" type="submit" disabled={isPending || storageLocked}>
          {isPending ? "Subiendo..." : submitLabel}
        </button>
      </div>

      {storageLocked ? (
        <p className="status-text is-error">
          El almacenamiento de Cloudflare R2 ya llego al limite configurado. Elimina recursos o
          aumenta la capacidad antes de subir otro archivo.
        </p>
      ) : null}
      {error ? <p className="status-text is-error">{error}</p> : null}
      {success ? <p className="status-text is-ok">{success}</p> : null}
    </form>
  );
}
