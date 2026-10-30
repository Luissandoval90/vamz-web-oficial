import Link from "next/link";
export default function NotFound() {
  return (
    <main id="contenido" className="page-shell auth-shell">
      <section className="auth-card">
        <p className="section-kicker">404 / FUERA DEL MAPA</p>
        <h1 className="page-title">Por aquí no era.</h1>
        <p className="lead">
          Esta página no existe o el recurso ya no está disponible. Volvamos a
          explorar.
        </p>
        <div className="inline-actions" style={{ marginTop: 25 }}>
          <Link className="action-button is-accent" href="/recursos">
            Explorar recursos →
          </Link>
          <Link className="action-button is-dark" href="/">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
