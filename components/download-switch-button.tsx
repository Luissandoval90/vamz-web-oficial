type DownloadSwitchButtonProps = { href: string; label?: string; filename?: string };
export function DownloadSwitchButton({ href, label = "Descargar", filename = "recurso" }: DownloadSwitchButtonProps) {
  return <div className="download-button-stack"><a className="download-pill-button" href={href} download={filename}>{label}</a></div>;
}
