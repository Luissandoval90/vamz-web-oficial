"use client";
import Link from "next/link";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="contenido" className="page-shell auth-shell">
      <section className="auth-card">
        <p className="section-kicker">PAUSA INESPERADA</p>
        <h1 className="page-title page-title-sm">
          Algo no salió como esperábamos.
        </h1>
        <p className="lead">
          No pudimos cargar esta página. Puedes intentarlo de nuevo en un
          momento.
        </p>
        <div className="inline-actions" style={{ marginTop: 25 }}>
          <button
            className="action-button is-accent"
            type="button"
            onClick={reset}
          >
            Volver a intentar
          </button>
          <Link className="action-button is-dark" href="/">
            Ir al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
