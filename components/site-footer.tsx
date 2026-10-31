import Link from "next/link";
import { getPublicSocialLinks } from "@/lib/public-content";
import { getSocialLinkDisplayName } from "@/lib/social-links";
import { SocialLinkIcon } from "@/components/social-link-icon";
export async function SiteFooter() {
  const links = await getPublicSocialLinks();
  return (
    <footer className="site-footer">
      <div className="footer-inner studio-footer-inner">
        <div className="footer-brand-block">
          <Link className="wordmark" href="/" aria-label="VAMZ Studio, inicio">
            VAMZ
            <span className="brand-square" />
          </Link>
          <p>Un espacio para crear, jugar y compartir.</p>
          <div className="footer-socials">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={getSocialLinkDisplayName(link.platform)}
              >
                <SocialLinkIcon platform={link.platform} />
              </a>
            ))}
          </div>
        </div>
        <nav aria-label="Navegación del pie de página">
          <span>Tu siguiente partida</span>
          <Link href="/recursos">Recursos</Link>
          <Link href="/minecraft">Versiones de Minecraft</Link>
          <Link href="/#comunidad">Comunidad</Link>
        </nav>
        <nav aria-label="Información y cuenta">
          <span>En VAMZ</span>
          <Link href="/login">Iniciar sesión</Link>
          <Link href="/register">Crear una cuenta</Link>
          <Link href="/privacidad">Privacidad</Link>
        </nav>
        <div className="footer-bottom-row">
          <span className="copyright">
            © {new Date().getFullYear()} VAMZ Studio
          </span>
          <span>No es un sitio oficial de Mojang o Microsoft.</span>
          <a href="#contenido">Volver arriba ↑</a>
        </div>
      </div>
    </footer>
  );
}
