type SocialLinkIconProps = {
  platform: string;
  className?: string;
};

const normalizePlatform = (platform: string) => platform.trim().toLowerCase();

export function SocialLinkIcon({ platform, className }: SocialLinkIconProps) {
  const key = normalizePlatform(platform);

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
          d="M21.2 8.4a3.1 3.1 0 0 0-2.2-2.2C17 5.7 12 5.7 12 5.7s-5 0-7 .5A3.1 3.1 0 0 0 2.8 8.4 32.4 32.4 0 0 0 2.3 12c0 1.2.1 2.5.5 3.6A3.1 3.1 0 0 0 5 17.8c2 .5 7 .5 7 .5s5 0 7-.5a3.1 3.1 0 0 0 2.2-2.2c.3-1.1.5-2.4.5-3.6s-.2-2.5-.5-3.6Z"
          fill="currentColor"
        />
        <path d="M10 15.5v-7l6 3.5-6 3.5Z" fill="#ffffff" />
      </svg>
    );
  }

  if (key === "discord") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.7 8.6a9.8 9.8 0 0 1 6.6 0m-7.3 6.7c1.7 1.2 3.3 1.4 4 1.4.7 0 2.3-.2 4-1.4m-7.8-1.9c-.4 0-.8-.4-.8-1s.4-1 .8-1 .8.4.8 1-.4 1-.8 1Zm7.6 0c-.4 0-.8-.4-.8-1s.4-1 .8-1 .8.4.8 1-.4 1-.8 1Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.2 17.2c-1.4-.1-2-.9-2.3-1.7-.8-1.9-1-4-.6-6 .3-1.7 1.4-3.2 3-4 0 0 .9.3 2.2 1.2a8.7 8.7 0 0 1 5 0c1.3-.9 2.2-1.2 2.2-1.2 1.6.8 2.7 2.3 3 4 .4 2 .2 4.1-.6 6-.3.8-.9 1.6-2.3 1.7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
          d="M14 4c.5 1.5 1.4 2.8 2.6 3.7A6 6 0 0 0 20 9v3.1a9.6 9.6 0 0 1-3-.5V16a5 5 0 1 1-5-5c.3 0 .7 0 1 .1v3.2a2.2 2.2 0 1 0 1 1.8V4h0Z"
          fill="currentColor"
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
