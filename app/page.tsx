import type { CSSProperties } from "react";

import { desc } from "drizzle-orm";

import { PublicPageShell } from "@/components/public-page-shell";
import { SocialLinkIcon } from "@/components/social-link-icon";
import { getDb } from "@/db";
import { socialLinks } from "@/db/schema";
import {
  getSocialLinkAccent,
  getSocialLinkDisplayName,
  getSocialLinkGlow,
  getSocialLinkSurface,
} from "@/lib/social-links";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = getDb();
  const links = await db.select().from(socialLinks).orderBy(desc(socialLinks.updatedAt));

  return (
    <PublicPageShell
      active="home"
      subtitle="Inicio"
      title="Recursos y portadas de VAMZ."
      description="Todo lo importante del proyecto esta reunido en un solo lugar para que lo tengas siempre a mano."
      imageSrc="/remtop.webp"
      imageAlt="Rem banner"
      pageBackdrop={
        <div className="hero-video-shell" aria-hidden="true">
          <video
            className="hero-video"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          >
            <source src="/minecraft-hero-bg.mp4" type="video/mp4" />
          </video>
        </div>
      }
      heroFooter={
        <div className="hero-tags">
          <span className="tag-chip">Portadas</span>
          <span className="tag-chip">Recursos</span>
          <span className="tag-chip">Panel</span>
          <span className="tag-chip">Links</span>
        </div>
      }
    >
      {links.length > 0 ? (
        <article className="panel-card library-panel home-links-panel animate-up delay-1">
          <div className="section-heading">
            <p className="section-kicker">Links</p>
            <h2 className="section-title-sm">Redes oficiales</h2>
            <p className="body-copy">
              Aqui encuentras los perfiles y canales oficiales del proyecto.
            </p>
          </div>

          <div className="home-links-grid">
            {links.map((link) => (
              <a
                key={link.id}
                className="home-link-card"
                href={link.url}
                target="_blank"
                rel="noreferrer"
                style={
                  {
                    "--link-accent": getSocialLinkAccent(link.platform),
                    "--link-surface": getSocialLinkSurface(link.platform),
                    "--link-glow": getSocialLinkGlow(link.platform),
                  } as CSSProperties
                }
              >
                <span className="home-link-icon">
                  <SocialLinkIcon platform={link.platform} className="home-link-icon-svg" />
                </span>
                <span className="home-link-copy">
                  <strong>{getSocialLinkDisplayName(link.platform)}</strong>
                </span>
              </a>
            ))}
          </div>
        </article>
      ) : null}
    </PublicPageShell>
  );
}
