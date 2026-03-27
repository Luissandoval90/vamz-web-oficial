export const imageExtensions = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "avif",
  "bmp",
  "svg",
]);

export const archiveExtensions = new Set(["zip", "rar", "7z", "mcaddon", "mcpack"]);

export const getFileExtension = (filename: string) => filename.split(".").pop()?.toLowerCase() ?? "";

export const getResourceKind = (filename: string) => {
  const extension = getFileExtension(filename);

  if (imageExtensions.has(extension)) {
    return "Preview";
  }

  if (archiveExtensions.has(extension)) {
    return "Archive";
  }

  if (extension === "pdf") {
    return "Document";
  }

  return extension ? extension.toUpperCase() : "File";
};

export const getResourceDisplayTitle = (title: string | null | undefined, filename: string) =>
  title && title.trim() ? title : filename;

export const formatResourceDate = (value: string, locale = "es-PE") =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const formatBytes = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** exponent;
  const digits = size >= 100 || exponent === 0 ? 0 : size >= 10 ? 1 : 2;

  return `${size.toFixed(digits)} ${units[exponent]}`;
};
