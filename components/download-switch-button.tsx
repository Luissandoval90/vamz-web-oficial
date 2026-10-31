"use client";
import { useState } from "react";
import { UiIcon } from "@/components/ui-icon";
type DownloadSwitchButtonProps = {
  href: string;
  label?: string;
  filename?: string;
};
export function DownloadSwitchButton({
  href,
  label = "Descargar archivo",
  filename = "recurso",
}: DownloadSwitchButtonProps) {
  const [started, setStarted] = useState(false);
  return (
    <div className="download-button-stack">
      <a
        className="download-primary-button"
        href={href}
        download={filename}
        onClick={() => setStarted(true)}
      >
        <UiIcon name={started ? "check" : "download"} />
        <span>{started ? "Volver a descargar" : label}</span>
        <UiIcon name="arrow" />
      </a>
      {started ? (
        <p className="download-feedback" role="status">
          La descarga se ha enviado a tu navegador. Si no comienza, pulsa de
          nuevo.
        </p>
      ) : (
        <p className="download-feedback">
          Descarga directa, sin páginas intermedias.
        </p>
      )}
    </div>
  );
}
