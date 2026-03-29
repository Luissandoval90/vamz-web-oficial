const PLATFORM_LABELS: Record<string, string> = {
  behance: "Behance",
  discord: "Discord",
  facebook: "Facebook",
  instagram: "Instagram",
  kick: "Kick",
  paypal: "PayPal",
  pinterest: "Pinterest",
  telegram: "Telegram",
  threads: "Threads",
  tiktok: "TikTok",
  twitch: "Twitch",
  twitter: "Twitter",
  website: "Website",
  web: "Web",
  linkedin: "LinkedIn",
  x: "X",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
};

const PLATFORM_ACCENTS: Record<string, string> = {
  behance: "#1769FF",
  discord: "#5865F2",
  facebook: "#1877F2",
  instagram: "#E4407B",
  kick: "#53FC18",
  linkedin: "#0A66C2",
  paypal: "#003087",
  pinterest: "#E60023",
  telegram: "#229ED9",
  threads: "#101010",
  tiktok: "#30D5D8",
  twitch: "#9146FF",
  twitter: "#1DA1F2",
  website: "#6c7bff",
  web: "#6c7bff",
  x: "#111111",
  whatsapp: "#25D366",
  youtube: "#FF0033",
};

const PLATFORM_SURFACES: Record<string, string> = {
  behance: "linear-gradient(135deg, #1769ff 0%, #0f57d8 100%)",
  discord: "linear-gradient(135deg, #5865f2 0%, #6b78ff 100%)",
  facebook: "linear-gradient(135deg, #1877f2 0%, #1565d8 100%)",
  instagram:
    "linear-gradient(135deg, #f58529 0%, #f77737 20%, #dd2a7b 48%, #8134af 74%, #515bd4 100%)",
  kick: "linear-gradient(135deg, #53fc18 0%, #22c80a 100%)",
  linkedin: "linear-gradient(135deg, #0a66c2 0%, #084f96 100%)",
  paypal: "linear-gradient(135deg, #003087 0%, #0070ba 100%)",
  pinterest: "linear-gradient(135deg, #e60023 0%, #c2001d 100%)",
  telegram: "linear-gradient(135deg, #27a7e7 0%, #1d8fd1 100%)",
  threads: "linear-gradient(135deg, #151515 0%, #000000 100%)",
  tiktok: "linear-gradient(135deg, #131313 0%, #0a0a0a 100%)",
  twitch: "linear-gradient(135deg, #9146ff 0%, #6d2de3 100%)",
  twitter: "linear-gradient(135deg, #1da1f2 0%, #1187d1 100%)",
  website: "linear-gradient(135deg, #6c7bff 0%, #5363e7 100%)",
  web: "linear-gradient(135deg, #6c7bff 0%, #5363e7 100%)",
  x: "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)",
  whatsapp: "linear-gradient(135deg, #25d366 0%, #1fb657 100%)",
  youtube: "linear-gradient(135deg, #ff0033 0%, #ff1744 100%)",
};

const PLATFORM_GLOWS: Record<string, string> = {
  discord: "rgba(88, 101, 242, 0.34)",
  instagram: "rgba(221, 42, 123, 0.34)",
  tiktok: "rgba(37, 244, 238, 0.28)",
  youtube: "rgba(255, 0, 51, 0.32)",
};

export const SOCIAL_LINK_PLATFORM_OPTIONS = [
  "Instagram",
  "YouTube",
  "TikTok",
  "Discord",
  "Kick",
  "X",
  "PayPal",
  "Facebook",
  "WhatsApp",
  "Telegram",
  "Twitch",
  "LinkedIn",
  "Pinterest",
  "Threads",
  "Behance",
  "Website",
] as const;

const toTitleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

export const getSocialLinkDisplayName = (platform: string) => {
  const key = platform.trim().toLowerCase();
  return PLATFORM_LABELS[key] ?? toTitleCase(platform);
};

export const getSocialLinkAccent = (platform: string) => {
  const key = platform.trim().toLowerCase();
  return PLATFORM_ACCENTS[key] ?? "#fdaff3";
};

export const getSocialLinkSurface = (platform: string) => {
  const key = platform.trim().toLowerCase();
  return PLATFORM_SURFACES[key] ?? "linear-gradient(135deg, #fdaff3 0%, #d889d6 100%)";
};

export const getSocialLinkGlow = (platform: string) => {
  const key = platform.trim().toLowerCase();
  return PLATFORM_GLOWS[key] ?? "color-mix(in srgb, var(--link-accent) 28%, transparent)";
};

export const getSocialLinkBadge = (platform: string, icon?: string | null) => {
  const trimmedIcon = icon?.trim();

  if (trimmedIcon) {
    return trimmedIcon;
  }

  const displayName = getSocialLinkDisplayName(platform);
  return (
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "LK"
  );
};

export const getSocialLinkHostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
