"use client";

import { useState } from "react";

type DownloadSwitchButtonProps = {
  href: string;
  label?: string;
  filename?: string;
};

const getFilenameFromDisposition = (value: string | null, fallback: string) => {
  if (!value) {
    return fallback;
  }

  const utfMatch = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const plainMatch = value.match(/filename="?([^"]+)"?/i);
  return plainMatch?.[1] ?? fallback;
};

export function DownloadSwitchButton({
  href,
  label = "Descargar",
  filename = "recurso",
}: DownloadSwitchButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setError(null);
    setIsDownloading(true);

    try {
      const response = await fetch(href, {
        credentials: "same-origin",
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error ?? "No se pudo descargar el recurso.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const resolvedFilename = getFilenameFromDisposition(
        response.headers.get("Content-Disposition"),
        filename,
      );

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = resolvedFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "No se pudo descargar el recurso.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="download-button-stack">
      <button
        className="download-pill-button"
        type="button"
        disabled={isDownloading}
        onClick={handleDownload}
      >
        {isDownloading ? "Descargando..." : label}
      </button>
      {error ? <p className="status-text is-error">{error}</p> : null}
    </div>
  );
}
