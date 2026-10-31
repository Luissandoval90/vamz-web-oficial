"use client";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UiIcon } from "@/components/ui-icon";

type SiteHeaderProps = {
  subtitle?: string;
  actions: { href: string; label: string; variant?: "default" | "primary" }[];
  extraContent?: ReactNode;
};

export function SiteHeader({ actions, extraContent }: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  return (
    <header className="site-header" ref={header}>
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label="VAMZ Studio, inicio">
          VAMZ
          <span className="brand-square" />
          <span className="wordmark-label">Minecraft & comunidad</span>
        </Link>
        <button
          ref={toggle}
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="site-navigation"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen(!open)}
        >
          <UiIcon name={open ? "close" : "menu"} />
        </button>
        <div
          className={`header-navigation ${open ? "is-open" : ""}`}
          id="site-navigation"
        >
          <nav className="primary-navigation" aria-label="Navegación principal">
            <Link
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              Inicio
            </Link>
            <Link
              href="/recursos"
              aria-current={pathname.startsWith("/recurs") ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              Explorar
            </Link>
            <Link
              href="/minecraft"
              aria-current={pathname === "/minecraft" ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              Minecraft
            </Link>
            <Link href="/#comunidad" onClick={() => setOpen(false)}>
              Comunidad <UiIcon name="external" />
            </Link>
          </nav>
          <nav className="site-actions" aria-label="Tu cuenta">
            {actions.map((action) => (
              <Link
                key={action.href}
                className={`action-button ${action.variant === "primary" ? "is-accent" : "is-text"}`}
                href={action.href}
                onClick={() => setOpen(false)}
              >
                {action.label}
                {action.variant === "primary" ? <UiIcon name="arrow" /> : null}
              </Link>
            ))}
            {extraContent}
          </nav>
        </div>
      </div>
    </header>
  );
}
