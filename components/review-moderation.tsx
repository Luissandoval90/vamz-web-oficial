"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UiIcon } from "@/components/ui-icon";
type ModerationReview = {
  id: string;
  resourceId: string;
  title: string | null;
  filename: string;
  username: string | null;
  rating: number | null;
  kind?: "comment";
  body: string;
  approved: boolean;
  updatedAt: string;
};
export function ReviewModeration({ reviews }: { reviews: ModerationReview[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("pending");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const filtered = reviews.filter(
    (review) => filter === "all" || !review.approved,
  );
  async function moderate(id: string, approved: boolean, kind?: "comment") {
    if (pending) return;
    setPending(id);
    setError("");
    try {
      const response = await fetch(
        `/api/${kind === "comment" ? "comments" : "reviews"}/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved }),
        },
      );
      if (!response.ok) throw Error("No se pudo actualizar la opinión.");
      router.refresh();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Revisa tu conexión.",
      );
    } finally {
      setPending(null);
    }
  }
  return (
    <section className="panel-card">
      <div className="section-heading">
        <p className="section-kicker">Comunidad</p>
        <h2 className="section-title-sm">Comentarios y reseñas</h2>
        <p className="body-copy">
          Publica opiniones útiles y oculta contenido que no corresponda al
          recurso. Las reseñas editadas vuelven a revisión. Se muestran hasta
          200 opiniones, priorizando las pendientes.
        </p>
      </div>
      <div
        className="catalog-filters"
        role="group"
        aria-label="Filtrar opiniones"
      >
        <button
          type="button"
          aria-pressed={filter === "pending"}
          className={filter === "pending" ? "is-active" : ""}
          onClick={() => setFilter("pending")}
        >
          Pendientes ({reviews.filter((review) => !review.approved).length})
        </button>
        <button
          type="button"
          aria-pressed={filter === "all"}
          className={filter === "all" ? "is-active" : ""}
          onClick={() => setFilter("all")}
        >
          Todas ({reviews.length})
        </button>
      </div>
      {error ? (
        <p className="status-text is-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="moderation-grid">
        {filtered.length ? (
          filtered.map((review) => (
            <article className="moderation-card" key={review.id}>
              <div className="moderation-top">
                <Link href={`/recurso/${review.resourceId}`}>
                  {review.title || review.filename}
                </Link>
                <span>
                  <UiIcon
                    name={review.kind === "comment" ? "message" : "star"}
                  />{" "}
                  {review.kind === "comment"
                    ? "Comentario"
                    : `${review.rating}/5`}
                </span>
                <span
                  className={`moderation-status ${review.approved ? "is-approved" : ""}`}
                >
                  {review.approved ? "Visible" : "Pendiente"}
                </span>
              </div>
              <p>{review.body}</p>
              <p className="inline-note">
                Por {review.username || "Miembro"} ·{" "}
                {new Intl.DateTimeFormat("es-PE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(review.updatedAt))}
              </p>
              <div className="row-actions">
                <button
                  className={`action-button ${review.approved ? "is-dark" : "is-accent"}`}
                  disabled={pending !== null}
                  type="button"
                  onClick={() =>
                    moderate(review.id, !review.approved, review.kind)
                  }
                >
                  {pending === review.id
                    ? "Guardando…"
                    : review.approved
                      ? "Ocultar"
                      : "Aprobar y publicar"}
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-box">
            {filter === "pending"
              ? "No hay opiniones pendientes de revisión."
              : "Las opiniones de la comunidad aparecerán aquí."}
          </div>
        )}
      </div>
    </section>
  );
}
