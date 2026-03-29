"use client";

import { useState } from "react";

import { FloatingRail } from "@/components/floating-rail";
import { LogoutButton } from "@/components/logout-button";
import { ResourceLibrary } from "@/components/resource-library";
import { SocialLinksManager } from "@/components/social-links-manager";
import { UploadForm } from "@/components/upload-form";
import {
  getFileExtension,
  imageExtensions,
} from "@/lib/resource-utils";

type DashboardResource = {
  id: string;
  filename: string;
  path: string;
  title: string | null;
  description: string | null;
  coverPath: string | null;
  fileSize: number;
  coverSize: number;
  totalSize: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
};

type DashboardShellProps = {
  user: {
    id: string;
    email: string;
    username: string;
  };
  resources: DashboardResource[];
  socialLinks: {
    id: number;
    platform: string;
    url: string;
    icon: string;
    createdAt: string;
    updatedAt: string;
  }[];
  resourcesStorage: {
    limitBytes: number;
    usedBytes: number;
    availableBytes: number;
    usagePercent: number;
  };
  initialView: "panel" | "links";
};

export function DashboardShell({
  user,
  resources,
  socialLinks,
  resourcesStorage,
  initialView,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const view = initialView;

  const displayName = user.username || user.email;
  const featuredResource = resources.find(
    (resource) => resource.coverPath || imageExtensions.has(getFileExtension(resource.filename)),
  );
  const featuredPreview = featuredResource
    ? featuredResource.coverPath
      ? `/api/resources/${featuredResource.id}/cover`
      : `/api/resources/${featuredResource.id}`
    : "/remtop.webp";

  const navigationItems = [
    {
      id: "home",
      label: "Inicio",
      icon: "home" as const,
      href: "/",
    },
    {
      id: "resources",
      label: "Recursos",
      icon: "folder" as const,
      href: "/recursos",
    },
    {
      id: "panel" as const,
      label: "Panel",
      icon: "spark" as const,
      href: "/dashboard",
    },
    {
      id: "links" as const,
      label: "Links",
      icon: "link" as const,
      href: "/dashboard?view=links",
    },
  ];

  const currentView = navigationItems.find((item) => item.id === view);

  const renderPanelView = () => (
    <>
      <UploadForm
        title="Panel de recursos"
        description="Sube un archivo nuevo y organiza su informacion desde la biblioteca."
        submitLabel="Subir recurso"
        successMessage="Recurso subido y publicado."
        publishOnUpload
        storage={resourcesStorage}
      />

      <ResourceLibrary
        resources={resources}
        kicker="Panel"
        title="Tus recursos"
        description="Desde aqui puedes editar, ordenar y publicar lo que quieras mostrar en la web."
        emptyStateCopy="Todavia no has subido ningun recurso."
        showSearch
        showEditControls
        className="library-panel dashboard-library-block"
      />
    </>
  );

  const renderLinksView = () => <SocialLinksManager links={socialLinks} />;

  return (
    <>
      <header className="site-header dashboard-topbar dashboard-topbar-plain">
        <div className="site-actions">
          <div className="topbar-pill">{displayName}</div>
          <button
            className="action-button is-dark mobile-toggle"
            type="button"
            onClick={() => setSidebarOpen((current) => !current)}
          >
            Menu
          </button>
          <LogoutButton className="action-button is-accent" />
        </div>
      </header>

      <main className="page-shell page-body">
        <div className="content-layout dashboard-layout">
          <div className={`dashboard-sidebar-wrap ${sidebarOpen ? "is-open" : ""}`}>
            <FloatingRail
              title="Secciones"
              items={navigationItems.map((item) => ({
                id: item.id,
                label: item.label,
                icon: item.icon,
                href: item.href,
                active: item.id === view,
              }))}
            />
          </div>

          <section className="page-main dashboard-main">
          <section className="panel-card hero-panel dashboard-hero-panel">
              <div className="hero-copy">
                <p className="section-kicker">{currentView?.label ?? "Panel"}</p>
                <h1 className="page-title dashboard-page-title">Panel de control.</h1>
                <p className="lead">
                  Hola, {displayName}. Desde este panel puedes subir recursos y gestionar los
                  enlaces que aparecen en la pagina principal.
                </p>
              </div>

              <div className="hero-media dashboard-hero-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="hero-media-image" src={featuredPreview} alt="Preview destacado" />
              </div>
            </section>

            {view === "panel" ? renderPanelView() : null}
            {view === "links" ? renderLinksView() : null}
          </section>
        </div>
      </main>
    </>
  );
}
