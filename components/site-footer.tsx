import Link from "next/link";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner studio-footer-inner">
        <div className="footer-brand-block">
          <Link className="wordmark" href="/" aria-label="VAMZ Studio, inicio">
            VAMZ
            <span className="brand-square" />
          </Link>
          <p>Un espacio para crear, jugar y compartir.</p>
        </div>
        <nav aria-label="Navegación del pie de página">
          <span>Tu siguiente partida</span>
          <Link href="/recursos">Recursos</Link>
          <Link href="/minecraft">Versiones de Minecraft</Link>
          <Link href="/#comunidad">Comunidad</Link>
        </nav>
        <nav aria-label="Información">
          <span>Información</span>
          <Link href="/#ayuda">Ayuda para empezar</Link>
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
