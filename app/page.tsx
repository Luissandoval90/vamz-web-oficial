import Image from "next/image";
import Link from "next/link";
import { PublicFrame } from "@/components/public-frame";
import { ResourceCatalog } from "@/components/resource-catalog";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SocialLinkIcon } from "@/components/social-link-icon";
import { UiIcon } from "@/components/ui-icon";
import { getPublicResources, getPublicSocialLinks } from "@/lib/public-content";
import { getSocialLinkDisplayName } from "@/lib/social-links";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [resources, links] = await Promise.all([
    getPublicResources(6),
    getPublicSocialLinks(),
  ]);
  const discord = links.find(
    (link) => link.platform.toLowerCase() === "discord",
  );
  return (
    <PublicFrame>
      <main id="contenido">
        <section className="home-hero page-shell">
          <div className="hero-intro">
            <p className="eyebrow">
              <span className="status-dot" /> EL UNIVERSO DE VAMZ
            </p>
            <h1>
              Menos límites.
              <br />
              Más{" "}
              <span className="accent-word">
                creatividad<span className="pixel-period">.</span>
              </span>
            </h1>
            <p className="hero-description">
              Recursos, portadas y un mundo por explorar.
              <br className="desktop-break" /> Todo lo que comparto, en un mismo
              lugar.
            </p>
            <div className="hero-cta">
              <Link
                className="action-button is-accent is-large"
                href="/recursos"
              >
                Explorar recursos <UiIcon name="arrow" />
              </Link>
              <a className="text-link" href="#comunidad">
                Conoce la comunidad <UiIcon name="external" />
              </a>
            </div>
            <div className="hero-note">
              <span className="tiny-cube" />
              <span>
                Creado para quienes disfrutan hacer las cosas a su manera.
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-art-top">
              <span>
                <span className="status-dot" /> VAMZ WORLD
              </span>
              <span>01 / EXPLORE</span>
            </div>
            <div className="hero-landscape">
              <Image
                src="/minecraft-landscape.webp"
                alt="Un mundo de Minecraft entre árboles y construcciones"
                fill
                priority
                sizes="(max-width: 760px) 100vw, 52vw"
              />
              <span className="art-cross cross-one">+</span>
              <span className="art-cross cross-two">+</span>
              <div className="art-stamp">
                BUILD.
                <br />
                PLAY.
                <br />
                <span>REPEAT.</span>
              </div>
            </div>
            <Image
              className="hero-character"
              src="/vamz-character.webp"
              alt="Skin de Minecraft de VAMZ con camiseta blanca y cabello negro"
              width={344}
              height={746}
              priority
            />
            <div className="hero-art-bottom">
              <span>UN MUNDO. TU ESTILO.</span>
              <UiIcon name="external" />
            </div>
            <span className="art-coordinate" aria-hidden="true">
              X: 024 / Y: 064 / Z: 128
            </span>
          </div>
        </section>
        <div className="topic-strip">
          <div className="page-shell">
            <span>MINECRAFT & CREATIVIDAD</span>
            <span className="strip-star">✳</span>
            <span>RECURSOS PARA EXPLORAR</span>
            <span className="strip-star">✳</span>
            <span>HECHO PARA COMPARTIR</span>
            <span className="strip-star">✳</span>
            <span>ESTO ES VAMZ</span>
          </div>
        </div>
        <section className="resources-section page-shell" id="recursos">
          <ScrollReveal>
            <div className="section-topline">
              <div>
                <p className="section-kicker">LA BIBLIOTECA</p>
                <h2 className="section-title">Dale tu propio estilo.</h2>
              </div>
              <Link className="text-link" href="/recursos">
                Ver todos los recursos <UiIcon name="arrow" />
              </Link>
            </div>
            <p className="section-description">
              Explora los últimos archivos y encuentra algo para tu próxima
              idea.
            </p>
            <ResourceCatalog resources={resources.slice(0, 6)} compact />
          </ScrollReveal>
        </section>
        <section className="community-section page-shell" id="comunidad">
          <ScrollReveal>
            <div className="community-banner">
              <div className="community-visual" aria-hidden="true">
                <span className="community-asterisk">✳</span>
                <span className="community-small">VAMZ / COMMUNITY</span>
              </div>
              <div className="community-copy">
                <p className="section-kicker">EL JUEGO SIGUE FUERA DE LA WEB</p>
                <h2>
                  Las buenas ideas
                  <br />
                  se comparten.
                </h2>
                <p>
                  Encuéntrame en redes, descubre lo que viene y forma parte de
                  la comunidad.
                </p>
                {discord ? (
                  <a
                    className="action-button is-light"
                    href={discord.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SocialLinkIcon platform="discord" className="ui-icon" />{" "}
                    Unirme al Discord <UiIcon name="external" />
                  </a>
                ) : (
                  <a className="action-button is-light" href="#redes">
                    Ver redes oficiales <UiIcon name="arrow" />
                  </a>
                )}
              </div>
            </div>
          </ScrollReveal>
          <div className="social-row" id="redes">
            <span className="social-row-label">NOS VEMOS POR AQUÍ</span>
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <SocialLinkIcon platform={link.platform} className="ui-icon" />
                <span>{getSocialLinkDisplayName(link.platform)}</span>
                <UiIcon name="external" />
              </a>
            ))}
          </div>
        </section>
      </main>
    </PublicFrame>
  );
}
