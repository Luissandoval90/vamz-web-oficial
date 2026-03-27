import type { CSSProperties } from "react";

import { desc } from "drizzle-orm";

import { PublicPageShell } from "@/components/public-page-shell";
import { SocialLinkIcon } from "@/components/social-link-icon";
import { getDb } from "@/db";
import { socialLinks } from "@/db/schema";
import {
  getSocialLinkAccent,
  getSocialLinkDisplayName,
} from "@/lib/social-links";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = getDb();
  const links = await db.select().from(socialLinks).orderBy(desc(socialLinks.updatedAt));

  return (
    <PublicPageShell
      active="home"
      subtitle="Inicio"
      title="Recursos y portadas del estudio."
      description="Aqui tienes reunido el material principal de VAMZ Studio para entrar al panel y mantener todo mas a mano."
      imageSrc="/remtop.webp"
      imageAlt="Rem banner"
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
            <h2 className="section-title-sm">Redes del proyecto</h2>
            <p className="body-copy">
              Aqui aparecen las redes que publiques desde el panel del admin.
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
