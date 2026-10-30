import Image from "next/image";
import Link from "next/link";
import { PublicFrame } from "@/components/public-frame";
import { ResourceCatalog } from "@/components/resource-catalog";
import { SocialLinkIcon } from "@/components/social-link-icon";
import { UiIcon } from "@/components/ui-icon";
import { getPublicResources, getPublicSocialLinks } from "@/lib/public-content";
import { getSocialLinkDisplayName, getSocialLinkDescription, getSocialLinkHandle } from "@/lib/social-links";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [resources, links] = await Promise.all([getPublicResources(6), getPublicSocialLinks()]);
  const discord = links.find(link => link.platform.toLowerCase() === "discord");
  const channels = discord ? links.filter(link => link.id !== discord.id) : links;
  return <PublicFrame>
    <main id="contenido" className="world-home">
      <section className="world-hero page-shell" aria-labelledby="world-title">
        <div className="world-intro">
          <p className="world-signature"><span className="status-dot" /> Minecraft, a mi manera.</p>
          <h1 id="world-title">Un mundo por crear.</h1>
          <p className="world-description">Packs, recursos y nuevas formas de jugar. Explora lo que preparo para la comunidad y dale tu estilo a cada partida.</p>
          <div className="hero-cta">
            <Link className="action-button is-accent is-large" href="/recursos">Explorar recursos <UiIcon name="arrow" /></Link>
            <Link className="text-link" href="/minecraft">Versiones de Minecraft <UiIcon name="download" /></Link>
          </div>
          <a className="world-community-link" href="#comunidad"><span className="world-community-symbol"><UiIcon name="grid" /></span><span>Creado por VAMZ.<br /><strong>Compartido con la comunidad.</strong></span></a>
        </div>
        <div className="world-scene">
          <div className="world-scene-image"><Image src="/minecraft-landscape.webp" alt="Paisaje de Minecraft entre bosques y construcciones" fill priority sizes="(max-width: 760px) 100vw, 48vw" /></div>
          <span className="world-scene-word" aria-hidden="true">VAMZ</span>
          <Image className="world-skin" src="/vamz-character.webp" alt="Personaje de VAMZ con su skin de Minecraft" width={344} height={746} priority sizes="(max-width: 760px) 45vw, 23vw" />
          <div className="world-scene-caption"><span>Mi espacio. Tu próxima aventura.</span><span className="world-block" aria-hidden="true" /></div>
        </div>
      </section>
      <nav className="world-shortcuts page-shell" aria-label="Explora VAMZ">
        <Link href="/recursos"><UiIcon name="folder" /><span><strong>Recursos</strong><small>Packs y archivos para tu mundo</small></span><UiIcon name="arrow" /></Link>
        <Link href="/minecraft"><UiIcon name="download" /><span><strong>Minecraft</strong><small>Versiones por edición y dispositivo</small></span><UiIcon name="arrow" /></Link>
        <a href="#comunidad"><UiIcon name="grid" /><span><strong>Comunidad</strong><small>Redes, videos y directos de VAMZ</small></span><UiIcon name="arrow" /></a>
      </nav>
      <section className="resources-section page-shell" aria-labelledby="latest-title">
        <div className="section-topline"><div><p className="section-kicker">La biblioteca</p><h2 className="section-title" id="latest-title">Recién publicados.</h2></div><Link className="text-link" href="/recursos">Ver la biblioteca <UiIcon name="arrow" /></Link></div>
        <p className="section-description">Encuentra algo nuevo para tu próxima partida.</p>
        <ResourceCatalog resources={resources} compact />
      </section>
      <section className="world-community page-shell" id="comunidad" aria-labelledby="community-title">
        <div className="section-topline"><div><p className="section-kicker">Fuera del juego</p><h2 className="section-title" id="community-title">Nos vemos por aquí.</h2></div><p className="community-intro">Los canales oficiales de VAMZ.<br />Elige dónde seguir la aventura.</p></div>
        <div className={discord ? "world-channels has-discord" : "world-channels"} id="redes">
          {discord ? <a className="discord-invite" href={discord.url} target="_blank" rel="noopener noreferrer"><SocialLinkIcon platform="discord" className="discord-large-icon" /><span className="discord-invite-content"><span className="channel-platform">Discord</span><h3>Tu comunidad te espera.</h3><p>Comparte ideas, descubre las novedades y habla con quienes disfrutan lo mismo que tú.</p><span className="discord-invite-button">Entrar a la comunidad <UiIcon name="external" /></span></span><span className="discord-blocks" aria-hidden="true" /></a> : null}
          <div className="channel-list">{channels.length ? channels.map(link => <a className="channel-link" key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"><span className="channel-icon"><SocialLinkIcon platform={link.platform} className="ui-icon" /></span><span className="channel-copy"><strong>{getSocialLinkDisplayName(link.platform)}</strong><span>{getSocialLinkDescription(link.platform)}</span><small>{getSocialLinkHandle(link.url)}</small></span><UiIcon name="external" /></a>) : !discord ? <p className="empty-box">Los canales oficiales aparecerán aquí cuando estén disponibles.</p> : <p className="community-intro">Todas las novedades de la comunidad, en Discord.</p>}</div>
        </div>
      </section>
    </main>
  </PublicFrame>;
}
