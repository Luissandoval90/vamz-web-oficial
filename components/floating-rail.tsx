"use client";

import Link from "next/link";

type RailIcon =
  | "home"
  | "calendar"
  | "link"
  | "spark"
  | "copy"
  | "user"
  | "stats"
  | "folder"
  | "image";

export type FloatingRailItem = {
  id: string;
  label: string;
  icon: RailIcon;
  href?: string;
  active?: boolean;
  onClick?: () => void;
};

type FloatingRailProps = {
  items: FloatingRailItem[];
  title?: string;
  className?: string;
  showInlineLabels?: boolean;
};

function Icon({ icon }: { icon: RailIcon }) {
  switch (icon) {
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4" />
          <path d="M8 3v4" />
          <path d="M3 10h18" />
        </svg>
      );
    case "link":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m10 14 4-4" />
          <path d="M9.5 7.5 8 9a4 4 0 1 0 5.7 5.7l1.5-1.5" />
          <path d="m14.5 16.5 1.5-1.5a4 4 0 1 0-5.7-5.7L8.8 10.8" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 3 1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3z" />
          <path d="M19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9z" />
        </svg>
      );
    case "copy":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <rect x="4" y="4" width="11" height="11" rx="2" />
        </svg>
      );
    case "folder":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      );
    case "image":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="m21 15-4.5-4.5L7 19" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c1.8-3.5 5-5 8-5s6.2 1.5 8 5" />
        </svg>
      );
    case "stats":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-6" />
          <path d="M22 20v-9" />
        </svg>
      );
    case "home":
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      );
  }
}

export function FloatingRail({
  items,
  title = "Secciones",
  className = "",
  showInlineLabels = false,
}: FloatingRailProps) {
  return (
    <aside
      className={`sidebar-menu-shell ${showInlineLabels ? "is-expanded" : ""} ${className}`.trim()}
      aria-label={title}
    >
      <p className="sidebar-menu-title">{title}</p>

      <nav className="sidebar-menu-list" aria-label={title}>
        {items.map((item) => {
          const itemClassName = `sidebar-menu-item ${item.active ? "is-active" : ""}`;

          if (item.href) {
            return (
              <Link
                key={item.id}
                className={itemClassName}
                data-item-id={item.id}
                href={item.href}
                aria-label={item.label}
                title={item.label}
              >
                <span className="sidebar-menu-icon">
                  <Icon icon={item.icon} />
                </span>
                {showInlineLabels ? <span className="sidebar-menu-label">{item.label}</span> : null}
                <span className="sidebar-menu-hint">{item.label}</span>
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              className={itemClassName}
              data-item-id={item.id}
              type="button"
              aria-label={item.label}
              title={item.label}
              onClick={item.onClick}
            >
              <span className="sidebar-menu-icon">
                <Icon icon={item.icon} />
              </span>
              {showInlineLabels ? <span className="sidebar-menu-label">{item.label}</span> : null}
              <span className="sidebar-menu-hint">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
