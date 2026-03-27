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
  instagram: "#E1306C",
  kick: "#53FC18",
  linkedin: "#0A66C2",
  paypal: "#003087",
  pinterest: "#E60023",
  telegram: "#229ED9",
  threads: "#101010",
  tiktok: "#25F4EE",
  twitch: "#9146FF",
  twitter: "#1DA1F2",
  website: "#6c7bff",
  web: "#6c7bff",
  x: "#111111",
  whatsapp: "#25D366",
  youtube: "#FF0033",
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
