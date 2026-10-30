type IconName =
  | "arrow"
  | "external"
  | "search"
  | "folder"
  | "download"
  | "close"
  | "menu"
  | "grid"
  | "check";

export function UiIcon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, string> = {
    arrow: "M4 12h16m-6-6 6 6-6 6",
    external: "M7 17 17 7M7 7h10v10",
    search: "m16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    folder: "M3 7V5h6l3 3h9v12H3V7Z",
    download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
    close: "m6 6 12 12M6 18 18 6",
    menu: "M4 7h16M4 12h16M4 17h16",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    check: "m5 12 4 4L19 6",
  };
  return (
    <svg
      className={`ui-icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
