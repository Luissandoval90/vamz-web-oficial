import type { ReactNode } from "react";

import Link from "next/link";

type SiteHeaderAction = {
  href: string;
  label: string;
  variant?: "default" | "primary";
};

type SiteHeaderProps = {
  subtitle?: string;
  actions: SiteHeaderAction[];
  extraContent?: ReactNode;
};

export function SiteHeader({ subtitle, actions, extraContent }: SiteHeaderProps) {
  if (actions.length === 0 && !extraContent) {
    return null;
  }

  return (
    <header className="site-header site-header-plain" aria-label={subtitle ?? "Navegacion"}>
      <nav className="site-actions" aria-label="Main navigation">
        {actions.map((action) => (
          <Link
            key={`${action.href}-${action.label}`}
            className={`action-button ${action.variant === "primary" ? "is-accent" : "is-dark"}`}
            href={action.href}
          >
            {action.label}
          </Link>
        ))}
        {extraContent}
      </nav>
    </header>
  );
}
