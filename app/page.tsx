import Image from "next/image";
import Link from "next/link";
import { PublicFrame } from "@/components/public-frame";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { ResourceCard } from "@/components/resource-card";
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
import { ResourceThumb } from "@/components/resource-thumb";
export const dynamic = "force-dynamic";
const questions = [
  [
    "¿Necesito una cuenta para descargar?",
    "Puedes explorar y descargar los recursos publicados sin registrarte. Crea una cuenta para comentar o compartir una reseña.",
  ],
  [
    "¿Cómo instalo un pack o addon?",
    "Abre la ficha y revisa el formato y la descripción del autor. En Bedrock, los archivos .mcpack y .mcaddon suelen importarse al abrirlos con Minecraft. Los archivos comprimidos pueden necesitar pasos adicionales según el recurso.",
  ],
  [
    "¿Cómo encuentro una versión para mi dispositivo?",
    "Entra en Minecraft y filtra por edición y plataforma. Antes de descargar, comprueba esos datos y el tamaño del archivo en su ficha.",
  ],
  [
    "¿Por qué mi reseña todavía no aparece?",
    "Las reseñas se revisan antes de publicarse. Si editas una reseña, vuelve a revisión. Puedes consultar su estado y retirarla desde la misma ficha al iniciar sesión.",
  ],
];
export default async function Home() {
  const [resources, links, versions] = await Promise.all([
    getPublicResources(),
    getPublicSocialLinks(),
    getPublicMinecraftVersions(),
  ]);
  const featured = resources.slice(0, 4);
  const featuredIds = new Set(featured.map((resource) => resource.id));
  const latest = resources
    .filter((resource) => !featuredIds.has(resource.id))
    .slice(0, 3);
  const discord = links.find(
    (link) => link.platform.toLowerCase() === "discord",
  );
  return (
    <PublicFrame>
      <main id="contenido" className="studio-home">
        <div className="page-shell studio-showcase">
          {resources.length ? (
            <FeaturedCarousel resources={featured} />
          ) : (
            <section className="studio-empty-hero">
              <h1>Un mundo de posibilidades.</h1>
              <p>
                La próxima aventura está por llegar. Explora la comunidad
                mientras llegan los nuevos recursos.
              </p>
              <Link href="#comunidad" className="action-button is-accent">
                Conocer la comunidad
              </Link>
            </section>
          )}
          <aside className="creator-note">
            <div className="creator-note-top">
              <span>Un lugar para crear</span>
              <strong>
                Juega a tu manera<span>.</span>
              </strong>
              <p>
                Ideas y recursos para llevar tu próxima partida un poco más
                lejos.
              </p>
            </div>
            <div className="creator-note-character">
              <Image
                src="/vamz-character.webp"
                alt="Skin de VAMZ"
                width={230}
                height={498}
                sizes="(max-width: 760px) 110px, 180px"
                priority
              />
            </div>
          </aside>
        </div>
        <section
          className="page-shell studio-section studio-new"
          id="novedades"
          aria-labelledby="latest-title"
        >
          <div className="studio-section-heading" data-reveal="heading">
            <div>
              <p className="section-kicker">Para descubrir</p>
              <h2 id="latest-title">Para tu próxima partida.</h2>
            </div>
            <Link href="/recursos" className="text-link">
              Ver los {resources.length} recursos <UiIcon name="arrow" />
            </Link>
          </div>
          {latest.length ? (
            <div className="public-resource-grid">
              {latest.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="catalog-empty">
              <h3>Los últimos recursos están en portada.</h3>
              <p>Abre la biblioteca para consultar todas las publicaciones.</p>
            </div>
          )}
        </section>
        <section
          data-reveal="section"
          className="studio-minecraft"
          aria-labelledby="minecraft-title"
        >
          <div className="studio-minecraft-landscape" data-parallax>
            <Image src="/minecraft-landscape.webp" alt="" fill sizes="100vw" />
          </div>
          <div className="page-shell studio-minecraft-inner">
            <div>
              <span className="minecraft-edition-tag">
                <UiIcon name="layers" /> Versiones de Minecraft
              </span>
              <h2 id="minecraft-title">
                Cada mundo tiene
                <br />
                un comienzo.
              </h2>
              <p>
                Encuentra tu edición, elige tu dispositivo y prepárate para la
                siguiente aventura.
              </p>
              <Link href="/minecraft" className="action-button is-accent">
                Encuentra tu versión <UiIcon name="arrow" />
              </Link>
            </div>
            {versions[0] ? (
              <div className="edition-card version-preview">
                <ResourceThumb resource={versions[0]} optimize />
                <div>
                  <span>
                    {versions[0].edition} · {versions[0].platform}
                  </span>
                  <h3>Minecraft {versions[0].version}</h3>
                  <p>
                    {formatBytes(versions[0].fileSize)} · {versions.length}{" "}
                    {versions.length === 1
                      ? "versión disponible"
                      : "versiones disponibles"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
        <section
          className="page-shell studio-section studio-community"
          data-reveal="section"
          id="comunidad"
          aria-labelledby="community-title"
        >
          <div className="studio-section-heading" data-reveal="heading">
            <div>
              <p className="section-kicker">Más allá de los bloques</p>
              <h2 id="community-title">La comunidad es parte del juego.</h2>
            </div>
            <p>
              Directos, nuevas ideas y un lugar
              <br />
              para compartir lo que creas.
            </p>
          </div>
          <div className="social-hub">
            {discord ? (
              <a
                href={discord.url}
                className="discord-hub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SocialLinkIcon
                  platform="discord"
                  className="discord-hub-icon"
                />
                <div>
                  <span>Nos vemos en Discord</span>
                  <h3>
                    Una buena partida
                    <br />
                    empieza con buena compañía.
                  </h3>
                  <p>
                    Comparte tus mundos, descubre ideas y charla con la
                    comunidad de VAMZ.
                  </p>
                </div>
                <span className="discord-hub-button">
                  Entrar a la comunidad <UiIcon name="external" />
                </span>
                <span className="discord-hub-decoration" aria-hidden="true">
                  <SocialLinkIcon platform="discord" />
                </span>
              </a>
            ) : null}
            <div className="social-hub-grid">
              {links
                .filter((link) => link.id !== discord?.id)
                .map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    className="social-hub-card"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="social-hub-card-top">
                      <SocialLinkIcon platform={link.platform} />
                      <UiIcon name="external" />
                    </span>
                    <strong>{getSocialLinkDisplayName(link.platform)}</strong>
                    <p>{getSocialLinkDescription(link.platform)}</p>
                    <span className="social-handle">
                      {getSocialLinkHandle(link.url)}
                    </span>
                  </a>
                ))}
            </div>
          </div>
        </section>
        <section
          className="page-shell studio-section studio-help"
          id="ayuda"
          data-reveal="section"
          aria-labelledby="help-title"
        >
          <div>
            <p className="section-kicker">Todo más claro</p>
            <h2 id="help-title">
              Antes de entrar
              <br />a tu mundo.
            </h2>
            <p>Las respuestas que necesitas para empezar.</p>
          </div>
          <div className="help-questions">
            {questions.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <UiIcon name="chevron" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </PublicFrame>
  );
}
