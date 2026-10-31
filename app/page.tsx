import Image from "next/image";
import Link from "next/link";
import { PublicFrame } from "@/components/public-frame";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { ResourceRail } from "@/components/resource-rail";
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
import {
  archiveExtensions,
  imageExtensions,
  getFileExtension,
} from "@/lib/resource-utils";
export const dynamic = "force-dynamic";
const questions = [
  [
    "¿Necesito una cuenta para descargar?",
    "Puedes explorar y descargar los recursos publicados sin registrarte. Crea una cuenta si quieres dejar una valoración y compartir tu experiencia con la comunidad.",
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
  const popular = [...resources]
    .sort((a, b) => b.downloads - a.downloads || b.views - a.views)
    .slice(0, 8);
  const hasActivity = popular.some((item) => item.downloads > 0);
  const platforms = [...new Set(versions.flatMap((item) => [item.platform, item.edition]))];
  const discord = links.find(
    (link) => link.platform.toLowerCase() === "discord",
  );
  const categories = [
    {
      href: "/recursos?type=packs",
      title: "Packs y addons",
      description: "Nuevas formas de jugar",
      icon: "layers" as const,
      count: resources.filter((item) =>
        archiveExtensions.has(getFileExtension(item.filename)),
      ).length,
    },
    {
      href: "/recursos?type=images",
      title: "Imágenes",
      description: "Ideas con otro punto de vista",
      icon: "grid" as const,
      count: resources.filter((item) =>
        imageExtensions.has(getFileExtension(item.filename)),
      ).length,
    },
    {
      href: "/minecraft",
      title: "Minecraft",
      description: "Encuentra tu edición y plataforma",
      icon: "globe" as const,
      count: versions.length,
    },
    {
      href: "/recursos",
      title: "Toda la biblioteca",
      description: "Encuentra tu próximo recurso",
      icon: "folder" as const,
      count: resources.length,
    },
  ].filter((category) => category.count > 0 || category.href === "/recursos");
  return (
    <PublicFrame>
      <main id="contenido" className="studio-home">
        <div className="page-shell studio-intro">
          <p>Tu próxima partida empieza aquí.</p>
          <span>
            <span className="online-dot" /> El universo de VAMZ
          </span>
        </div>
        <div className="page-shell studio-showcase">
          {resources.length ? (
            <FeaturedCarousel resources={resources.slice(0, 4)} />
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
              <span>El espacio de</span>
              <strong>
                VAMZ<span>.</span>
              </strong>
              <p>Recursos que le dan otra vida a Minecraft.</p>
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
            <Link href="#comunidad">
              Juega. Crea. Comparte. <UiIcon name="external" />
            </Link>
          </aside>
        </div>
        <div className="page-shell studio-quickbar">
          <span>
            <UiIcon name="download" /> Descargas directas
          </span>
          <span>
            <UiIcon name="message" /> Opiniones de la comunidad
          </span>
          <span>
            <UiIcon name="globe" /> En tu móvil y en tu PC
          </span>
          <Link href="/recursos">
            Explorar todo <UiIcon name="arrow" />
          </Link>
        </div>
        <section
          className="page-shell studio-section"
          aria-labelledby="discover-title"
        >
          <div className="studio-section-heading">
            <div>
              <p className="section-kicker">A tu manera</p>
              <h2 id="discover-title">¿Qué le falta a tu mundo?</h2>
            </div>
            <p>
              Pequeños cambios.
              <br />
              Una partida completamente distinta.
            </p>
          </div>
          <div className="discovery-grid">
            {categories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className="discovery-card"
              >
                <span className="discovery-icon">
                  <UiIcon name={category.icon} />
                </span>
                <span>
                  <strong>{category.title}</strong>
                  <span>{category.description}</span>
                </span>
                <span className="discovery-count">
                  {category.count}
                  <UiIcon name="external" />
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section
          className="page-shell studio-section studio-new"
          aria-labelledby="latest-title"
        >
          <div className="studio-section-heading">
            <div>
              <p className="section-kicker">Recién llegados</p>
              <h2 id="latest-title">Lo nuevo merece una partida.</h2>
            </div>
            <Link href="/recursos" className="text-link">
              Ver biblioteca <UiIcon name="arrow" />
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
              <h3>Preparando lo próximo.</h3>
              <p>Los recursos aparecerán aquí cuando estén publicados.</p>
            </div>
          )}
        </section>
        <section className="studio-minecraft" aria-labelledby="minecraft-title">
          <div className="studio-minecraft-landscape">
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
            <div className="edition-card">
              <div className="edition-card-head">
                <UiIcon name="globe" />
                <span>Elige dónde jugar</span>
              </div>
              <h3>
                Tu juego.
                <br />
                Tu plataforma.
              </h3>
              <div className="platform-list">
                {platforms.length ? platforms.map((platform) => <span key={platform}>{platform}</span>) : <span>Consulta la biblioteca</span>}
              </div>
              <p>
                {versions.length
                  ? `${versions.length} ${versions.length === 1 ? "versión disponible" : "versiones disponibles"} en la biblioteca`
                  : "Consulta las versiones publicadas"}
              </p>
              <Link href="/minecraft">
                Ver versiones y detalles <UiIcon name="external" />
              </Link>
            </div>
          </div>
        </section>
        {popular.length ? (
          <section
            className="page-shell studio-section studio-discover"
            aria-labelledby="popular-title"
          >
            <div className="studio-section-heading">
              <div>
                <p className="section-kicker">Sigue explorando</p>
                <h2 id="popular-title">
                  {hasActivity
                    ? "Los que más se descargan."
                    : "Tu próximo descubrimiento."}
                </h2>
              </div>
            </div>
            <ResourceRail>
              {popular.map((resource) => (
                <ResourceCard resource={resource} key={resource.id} />
              ))}
            </ResourceRail>
          </section>
        ) : null}
        <section
          className="page-shell studio-section studio-community"
          id="comunidad"
          aria-labelledby="community-title"
        >
          <div className="studio-section-heading">
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
          aria-labelledby="help-title"
        >
          <div>
            <p className="section-kicker">Todo más claro</p>
            <h2 id="help-title">
              Antes de entrar
              <br />a tu mundo.
            </h2>
            <p>Las respuestas que necesitas para empezar.</p>
            <Link href="/recursos" className="text-link">
              Volver a explorar <UiIcon name="arrow" />
            </Link>
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
