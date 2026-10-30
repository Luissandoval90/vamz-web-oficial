"use client";

import { useState } from "react";
import Link from "next/link";

import { FloatingRail } from "@/components/floating-rail";
import { LogoutButton } from "@/components/logout-button";
import { ResourceLibrary } from "@/components/resource-library";
import { SocialLinksManager } from "@/components/social-links-manager";
import { UploadForm } from "@/components/upload-form";
import { getFileExtension, imageExtensions } from "@/lib/resource-utils";
import type { MinecraftVersionMetadata } from "@/lib/minecraft-versions";

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
  minecraft?: MinecraftVersionMetadata | null;
};

type DashboardShellProps = {
  user: {
    id: string;
    email: string;
    username: string;
  };
  resources: DashboardResource[];
  versions: DashboardResource[];
  isAdmin: boolean;
  maxUploadBytes: number;
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
  initialView: "panel" | "links" | "minecraft";
};

export function DashboardShell({
  user,
  resources,
  versions,
  isAdmin,
  maxUploadBytes,
  socialLinks,
  resourcesStorage,
  initialView,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const view = initialView;

  const displayName = user.username || user.email;
  const featuredResource = resources.find(
    (resource) =>
      resource.coverPath ||
      imageExtensions.has(getFileExtension(resource.filename)),
  );
  const featuredPreview = featuredResource
    ? featuredResource.coverPath
      ? `/api/resources/${featuredResource.id}/cover`
      : `/api/resources/${featuredResource.id}`
    : "/vamz-character.webp";

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
      icon: "stats" as const,
      href: "/dashboard",
    },
    ...(isAdmin ? [{
      id: "minecraft" as const,
      label: "Minecraft",
      icon: "folder" as const,
      href: "/dashboard?view=minecraft",
    }, {
      id: "links" as const,
      label: "Redes",
      icon: "link" as const,
      href: "/dashboard?view=links",
    }] : []),
  ];

  const currentView = navigationItems.find((item) => item.id === view);

  const renderPanelView = () => (
    <>
      <UploadForm
        title="Panel de recursos"
        description={isAdmin ? "Publica y organiza los recursos de la comunidad." : "Comparte tus recursos. Tienes 180 MB en total para archivos y portadas."}
        submitLabel="Subir recurso"
        successMessage="Recurso subido y publicado."
        publishOnUpload
        storage={resourcesStorage}
        maxUploadBytes={maxUploadBytes}
      />

      <ResourceLibrary
        resources={resources}
        kicker="Panel"
        title={isAdmin ? "Recursos de la comunidad" : "Tus recursos"}
        description="Desde aqui puedes editar, ordenar y publicar lo que quieras mostrar en la web."
        emptyStateCopy="Todavia no has subido ningun recurso."
        showSearch
        showEditControls
        className="library-panel dashboard-library-block"
      />
    </>
  );

  const renderLinksView = () => <SocialLinksManager links={socialLinks} />;
  const renderMinecraftView = () => <>
    <UploadForm key="minecraft" minecraftMode kicker="Solo administradores" title="Subir versión de Minecraft"
      description="Añade el archivo, el número de versión, la edición y la plataforma."
      submitLabel="Publicar versión" successMessage="Versión de Minecraft publicada." publishOnUpload storage={resourcesStorage} maxUploadBytes={maxUploadBytes} />
    <ResourceLibrary resources={versions} kicker="Minecraft" title="Versiones publicadas"
      description="Gestiona las descargas que aparecen en la sección Minecraft."
      emptyStateCopy="Todavía no has subido ninguna versión de Minecraft." showSearch showEditControls className="library-panel dashboard-library-block" />
  </>;

  return (
    <>
      <header className="site-header dashboard-topbar dashboard-topbar-plain">
        <Link className="wordmark" href="/">
          VAMZ
          <span className="brand-square" />
        </Link>
        <div className="site-actions">
          <div className="topbar-pill">{displayName}</div>
          <button
            className="action-button is-dark mobile-toggle"
            type="button"
            aria-expanded={sidebarOpen}
            aria-controls="dashboard-navigation"
            onClick={() => setSidebarOpen((current) => !current)}
          >
            Menu
          </button>
          <LogoutButton className="action-button is-accent" />
        </div>
      </header>

      <main id="contenido" className="page-shell page-body">
        <div className="content-layout dashboard-layout">
          <div
            id="dashboard-navigation"
            className={`dashboard-sidebar-wrap ${sidebarOpen ? "is-open" : ""}`}
          >
            <FloatingRail
              showInlineLabels
              title="Secciones"
              items={navigationItems.map((item) => ({
                id: item.id,
                label: item.label,
                icon: item.icon,
                href: item.href,
                onClick: () => setSidebarOpen(false),
                active: item.id === view,
              }))}
            />
          </div>

          <section className="page-main dashboard-main">
            <section className="panel-card hero-panel dashboard-hero-panel">
              <div className="hero-copy">
                <p className="section-kicker">
                  {currentView?.label ?? "Panel"}
                </p>
                <h1 className="page-title dashboard-page-title">
                  {isAdmin ? "Panel de administración." : "Tu espacio."}
                </h1>
                <p className="lead">
                  Hola, {displayName}. {isAdmin ? "Gestiona los recursos, las versiones de Minecraft y las redes de la comunidad." : "Sube, edita y organiza tus recursos desde un solo lugar."}
                </p>
              </div>

              <div className="hero-media dashboard-hero-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="hero-media-image"
                  src={featuredPreview}
                  alt="Preview destacado"
                />
              </div>
            </section>

            {view === "panel" ? renderPanelView() : null}
            {view === "links" ? renderLinksView() : null}
            {view === "minecraft" && isAdmin ? renderMinecraftView() : null}
          </section>
        </div>
      </main>
    </>
  );
}
