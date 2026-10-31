import Image from "next/image";
import Link from "next/link";
import { PublicFrame } from "@/components/public-frame";
import { ResourceCard } from "@/components/resource-card";
import { ResourceThumb } from "@/components/resource-thumb";
import { ResourceMetrics } from "@/components/resource-metrics";
import { SocialLinkIcon } from "@/components/social-link-icon";
import { UiIcon } from "@/components/ui-icon";
import {
  getPublicResources,
  getPublicSocialLinks,
  getPublicMinecraftVersions,
} from "@/lib/public-content";
import {
  getSocialLinkDisplayName,
  getSocialLinkDescription,
  getSocialLinkHandle,
} from "@/lib/social-links";
import { formatBytes } from "@/lib/resource-utils";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [resources, links, versions] = await Promise.all([
    getPublicResources(),
    getPublicSocialLinks(),
    getPublicMinecraftVersions(),
  ]);
  const featured = resources[0];
  const discord = links.find(
    (link) => link.platform.toLowerCase() === "discord",
  );
  return (
    <PublicFrame>
      <main id="contenido" className="library-home">
        <section
          className="library-hero page-shell"
          aria-labelledby="home-title"
        >
          <div className="library-hero-backdrop">
            <Image
              src="/minecraft-landscape.webp"
              alt=""
              fill
              priority
              sizes="(max-width: 760px) 100vw, 1200px"
            />
          </div>
          <div className="library-hero-content">
            <div className="creator-signature">
              <span className="creator-avatar">
                <Image
                  src="/vamz-character.webp"
                  alt="Skin de VAMZ"
                  width={44}
                  height={44}
                  sizes="44px"
                />
              </span>
              <span>
                El espacio de VAMZ<span>Recursos y comunidad</span>
              </span>
            </div>
            <h1 id="home-title">Dale otra vida a tu mundo.</h1>
            <p className="library-hero-description">
              Packs, texturas y nuevas formas de jugar. Encuentra tu próximo
              recurso para Minecraft, sin dar vueltas.
            </p>
            <form className="hero-search-form" action="/recursos" role="search">
              <label className="sr-only" htmlFor="home-search">
                Buscar en la biblioteca
              </label>
              <UiIcon name="search" />
              <input
                id="home-search"
                type="search"
                name="q"
                maxLength={120}
                placeholder="¿Qué quieres añadir a tu mundo?"
                autoComplete="off"
              />
              <button type="submit">
                Buscar <UiIcon name="arrow" />
              </button>
            </form>
            <div className="hero-browse-links">
              <Link href="/recursos">
                Explorar {resources.length} recursos <UiIcon name="arrow" />
              </Link>
              <Link href="/minecraft">
                Versiones de Minecraft <UiIcon name="external" />
              </Link>
            </div>
          </div>
          {featured ? (
            <Link
              className="featured-resource"
              href={"/recurso/" + featured.id}
            >
              <span className="featured-label">
                <span className="status-dot" />
                Última publicación
              </span>
              <div className="featured-resource-image">
                <ResourceThumb resource={featured} optimize />
              </div>
              <div className="featured-resource-copy">
                <span>
                  {formatBytes(featured.fileSize)} · Por {featured.author}
                </span>
                <h2>{featured.title || featured.filename}</h2>
                <ResourceMetrics {...featured} />
                <strong>
                  Descubrir recurso <UiIcon name="arrow" />
                </strong>
              </div>
            </Link>
          ) : (
            <div className="hero-mascot">
              <Image
                src="/vamz-character.webp"
                alt="Personaje de VAMZ"
                width={230}
                height={498}
                priority
                sizes="230px"
              />
            </div>
          )}
        </section>
        <section
          className="page-shell library-latest"
          aria-labelledby="latest-title"
        >
          <div className="library-section-heading">
            <div>
              <p className="section-kicker">La biblioteca</p>
              <h2 id="latest-title">Algo nuevo para tu próxima partida.</h2>
              <p>Pruébalo, dale tu estilo y comparte tu experiencia.</p>
            </div>
            <Link className="action-button is-dark" href="/recursos">
              Ver todos <UiIcon name="arrow" />
            </Link>
          </div>
          {resources.length ? (
            <div className="public-resource-grid">
              {resources.slice(0, 6).map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="catalog-empty">
              <h3>Lo próximo está por llegar.</h3>
              <p>Los recursos aparecerán aquí cuando estén publicados.</p>
            </div>
          )}
        </section>
        <section className="page-shell minecraft-callout">
          <div className="minecraft-callout-symbol" aria-hidden="true">
            <UiIcon name="download" />
          </div>
          <div>
            <p className="section-kicker">Cada dispositivo, su versión</p>
            <h2>Encuentra tu Minecraft.</h2>
            <p>
              Consulta la edición, la plataforma y el tamaño del archivo antes
              de descargar.
            </p>
          </div>
          <Link href="/minecraft" className="action-button is-accent">
            Ver{" "}
            {versions.length
              ? versions.length +
                (versions.length === 1 ? " versión" : " versiones")
              : "versiones"}{" "}
            <UiIcon name="arrow" />
          </Link>
        </section>
        <section
          className="page-shell library-community"
          id="comunidad"
          aria-labelledby="community-title"
        >
          <div className="library-section-heading">
            <div>
              <p className="section-kicker">La partida sigue fuera del juego</p>
              <h2 id="community-title">Nos vemos en la comunidad.</h2>
              <p>Videos, directos y lo que viene para VAMZ.</p>
            </div>
          </div>
          <div className="community-layout">
            {discord ? (
              <a
                className="community-discord"
                href={discord.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <SocialLinkIcon
                  platform="discord"
                  className="discord-feature-icon"
                />
                <h3>Tu siguiente idea puede empezar en una conversación.</h3>
                <p>Comparte tus descubrimientos y habla con la comunidad.</p>
                <span>
                  Unirme a Discord <UiIcon name="external" />
                </span>
              </a>
            ) : null}
            <div className="official-channels">
              {links
                .filter((link) => link.id !== discord?.id)
                .map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    className="official-channel"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="channel-icon">
                      <SocialLinkIcon
                        platform={link.platform}
                        className="ui-icon"
                      />
                    </span>
                    <span>
                      <strong>{getSocialLinkDisplayName(link.platform)}</strong>
                      <span>{getSocialLinkDescription(link.platform)}</span>
                      <small>{getSocialLinkHandle(link.url)}</small>
                    </span>
                    <UiIcon name="external" />
                  </a>
                ))}
            </div>
          </div>
        </section>
      </main>
    </PublicFrame>
  );
}
