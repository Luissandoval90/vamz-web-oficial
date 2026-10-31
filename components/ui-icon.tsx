type IconName =
  | "arrow"
  | "external"
  | "search"
  | "folder"
  | "download"
  | "close"
  | "menu"
  | "grid"
  | "play"
  | "pause"
  | "spark"
  | "layers"
  | "globe"
  | "chevron"
  | "check";
type CommunityIconName =
  "star" | "eye" | "message" | "clock" | "shield" | "heart";

export function UiIcon({
  name,
  className = "",
}: {
  name: IconName | CommunityIconName;
  className?: string;
}) {
  const paths: Record<IconName | CommunityIconName, string> = {
    star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
    play: "m9 5 11 7-11 7V5Z",
    pause: "M8 5v14M16 5v14",
    spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
    layers: "m12 3 10 6-10 6L2 9l10-6ZM2 13l10 6 10-6M2 17l10 6 10-6",
    globe:
      "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z",
    chevron: "m6 9 6 6 6-6",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    message: "M21 11a8 8 0 0 1-8 8H7l-4 3V11a9 9 0 0 1 18 0Z",
    clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6",
    heart:
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
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
