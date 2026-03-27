export default function Loading() {
  return (
    <main className="page-loader-shell" aria-live="polite" aria-busy="true">
      <div className="page-loader" aria-hidden="true">
        <div className="page-loader-orb" />
        <div className="page-loader-orb" />
        <div className="page-loader-orb" />
        <div className="page-loader-shadow" />
        <div className="page-loader-shadow" />
        <div className="page-loader-shadow" />
      </div>
      <p className="page-loader-copy">Cargando...</p>
    </main>
  );
}
