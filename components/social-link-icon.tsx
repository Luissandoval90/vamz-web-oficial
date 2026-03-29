type SocialLinkIconProps = {
  platform: string;
  className?: string;
};

const normalizePlatform = (platform: string) => platform.trim().toLowerCase();

export function SocialLinkIcon({ platform, className }: SocialLinkIconProps) {
  const key = normalizePlatform(platform);

  if (key === "discord") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M20.3 4.37A17.43 17.43 0 0 0 15.9 3c-.2.36-.44.85-.6 1.23a16.2 16.2 0 0 0-4.6 0A12.6 12.6 0 0 0 10.1 3a17.1 17.1 0 0 0-4.42 1.38C2.9 8.46 2.14 12.44 2.52 16.37A17.74 17.74 0 0 0 7.9 19c.43-.58.81-1.2 1.14-1.86-.63-.24-1.23-.54-1.8-.9.15-.11.3-.23.44-.35 3.47 1.63 7.24 1.63 10.67 0 .15.12.3.24.44.35-.57.36-1.18.66-1.8.9.33.66.71 1.28 1.14 1.86a17.63 17.63 0 0 0 5.38-2.63c.45-4.56-.77-8.5-3.1-12Zm-8.6 9.6c-1.05 0-1.92-.98-1.92-2.17 0-1.2.84-2.17 1.92-2.17 1.09 0 1.95.98 1.93 2.17 0 1.2-.84 2.17-1.93 2.17Zm6.6 0c-1.06 0-1.92-.98-1.92-2.17 0-1.2.84-2.17 1.92-2.17 1.08 0 1.94.98 1.92 2.17 0 1.2-.84 2.17-1.92 2.17Z" />
      </svg>
    );
  }

  if (key === "instagram") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
      </svg>
    );
  }

  if (key === "youtube") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21.6 8.7a2.98 2.98 0 0 0-2.1-2.11C17.68 6.1 12 6.1 12 6.1s-5.68 0-7.5.49A2.98 2.98 0 0 0 2.4 8.7C1.9 10.52 1.9 12 1.9 12s0 1.48.5 3.3a2.98 2.98 0 0 0 2.1 2.11c1.82.49 7.5.49 7.5.49s5.68 0 7.5-.49a2.98 2.98 0 0 0 2.1-2.11c.5-1.82.5-3.3.5-3.3s0-1.48-.5-3.3Z"
          fill="currentColor"
        />
        <path d="M10.25 15.3V8.7L15.85 12l-5.6 3.3Z" fill="#ffffff" />
      </svg>
    );
  }

  if (key === "tiktok") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13.08 4.18v10.05a2.33 2.33 0 1 1-2.33-2.23c.22 0 .43.03.64.09V9.66a4.77 4.77 0 1 0 4.12 4.71V9.24a6.46 6.46 0 0 0 3.78 1.21V8.01a4.36 4.36 0 0 1-3.08-1.28 4.4 4.4 0 0 1-1.12-2.55h-2.01Z"
          fill="#25F4EE"
          opacity="0.95"
          transform="translate(-0.55 0.35)"
        />
        <path
          d="M13.08 4.18v10.05a2.33 2.33 0 1 1-2.33-2.23c.22 0 .43.03.64.09V9.66a4.77 4.77 0 1 0 4.12 4.71V9.24a6.46 6.46 0 0 0 3.78 1.21V8.01a4.36 4.36 0 0 1-3.08-1.28 4.4 4.4 0 0 1-1.12-2.55h-2.01Z"
          fill="#FE2C55"
          opacity="0.9"
          transform="translate(0.45 -0.35)"
        />
        <path
          d="M13.08 4.18v10.05a2.33 2.33 0 1 1-2.33-2.23c.22 0 .43.03.64.09V9.66a4.77 4.77 0 1 0 4.12 4.71V9.24a6.46 6.46 0 0 0 3.78 1.21V8.01a4.36 4.36 0 0 1-3.08-1.28 4.4 4.4 0 0 1-1.12-2.55h-2.01Z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  if (key === "facebook") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.2-1.6 1.5-1.6H16.5V4.8c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.3-3.8 3.9V11H8v3h2.5v7h3Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (key === "paypal") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 20.5H5.8a.8.8 0 0 1-.8-.9L7 5.2A1.4 1.4 0 0 1 8.4 4h6c2.5 0 4.5 1.7 4.1 4.6-.4 3-2.5 4.8-5.7 4.8h-2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 20.5H7.9l1.4-9.1a1.2 1.2 0 0 1 1.2-1H14c2.2 0 3.5 1.2 3.2 3.3-.4 2.8-2 4.1-4.8 4.1h-1.6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (key === "x" || key === "twitter") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 4h3.4l3.8 5.4L16.9 4H20l-6.2 7.2L20 20h-3.4l-4.2-5.9L7.3 20H4l6.7-7.8L5 4Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (key === "kick") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M5 4h4v6l4-6h6l-6 7.5L19 20h-6l-4-5.8V20H5V4Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <span aria-hidden="true" className={className}>
      {platform.trim().charAt(0).toUpperCase() || "L"}
    </span>
  );
}
