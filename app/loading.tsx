export default function Loading() {
  return (
    <main
      id="contenido"
      className="page-shell loading-library"
      aria-busy="true"
      aria-label="Cargando contenido"
    >
      <span className="sr-only" role="status">
        Cargando recursos…
      </span>
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-search" />
      <div className="loading-card-grid">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="loading-resource-card" aria-hidden="true">
            <div className="skeleton skeleton-cover" />
            <div className="skeleton skeleton-card-title" />
            <div className="skeleton skeleton-line" />
          </div>
        ))}
      </div>
    </main>
  );
}
