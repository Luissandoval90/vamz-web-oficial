export default function Loading() {
  return (
    <main
      id="contenido"
      className="page-loader-shell"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="loading-mark" aria-hidden="true" />
      <p>Cargando tu próximo mundo…</p>
    </main>
  );
}
