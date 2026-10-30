import Link from "next/link";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link className="wordmark" href="/" aria-label="VAMZ Studio, inicio">
          VAMZ
          <span className="brand-square" />
        </Link>
        <p>Un espacio para crear, jugar y compartir.</p>
        <nav aria-label="Navegación del pie de página">
          <Link href="/recursos">Recursos</Link>
          <Link href="/#comunidad">Comunidad</Link>
          <a href="#contenido">Volver arriba ↑</a>
        </nav>
        <span className="copyright">
          © {new Date().getFullYear()} VAMZ Studio
        </span>
      </div>
    </footer>
  );
}
