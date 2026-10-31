"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ResourceMetrics,
  type ResourceMetricsData,
} from "@/components/resource-metrics";
import { UiIcon } from "@/components/ui-icon";

export type PublicReview = {
  id: string;
  rating: number;
  body: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  approved: boolean;
};
type Props = {
  resourceId: string;
  initialSummary: ResourceMetricsData;
  initialReviews: PublicReview[];
  ownReview: PublicReview | null;
  loggedIn: boolean;
  canReview: boolean;
};
const reviewDate = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
function RatingStars({ value }: { value: number }) {
  return (
    <span className="rating-stars" role="img" aria-label={value ? `${value} de 5 estrellas` : "Sin valoraciones"}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? "is-filled" : ""}>
          <UiIcon name="star" />
        </span>
      ))}
    </span>
  );
}
export function ResourceReviews({
  resourceId,
  initialSummary,
  initialReviews,
  ownReview: initialOwn,
  loggedIn,
  canReview,
}: Props) {
  const [summary, setSummary] = useState(initialSummary);
  const [reviews, setReviews] = useState(initialReviews);
  const [own, setOwn] = useState(initialOwn);
  const [rating, setRating] = useState(initialOwn?.rating ?? 0);
  const [body, setBody] = useState(initialOwn?.body ?? "");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const counted = useRef(false);
  useEffect(() => {
    const countView = () => {
      if (document.visibilityState !== "visible" || counted.current) return;
      counted.current = true;
      void fetch(`/api/resources/${resourceId}/stats`, { method: "POST" })
        .then((response) => (response.ok ? response.json() : null))
        .then((value) => {
          if (value) setSummary(value);
        })
        .catch(() => {});
    };
    countView();
    document.addEventListener("visibilitychange", countView);
    return () => document.removeEventListener("visibilitychange", countView);
  }, [resourceId]);
  async function refresh() {
    const response = await fetch(`/api/resources/${resourceId}/reviews`, {
      cache: "no-store",
    });
    if (!response.ok) throw Error("No se pudieron actualizar las reseñas.");
    const data = await response.json();
    setReviews(data.reviews);
    setOwn(data.ownReview);
    setSummary(data.summary);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    setFeedback("");
    try {
      const response = await fetch(`/api/resources/${resourceId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, body }),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error ?? "No se pudo guardar la reseña.");
      setFeedback(data.message);
      await refresh();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Revisa tu conexión e inténtalo de nuevo.",
      );
    } finally {
      setPending(false);
    }
  }
  async function remove() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/resources/${resourceId}/reviews`, {
        method: "DELETE",
      });
      if (!response.ok) throw Error("No se pudo retirar la reseña.");
      setRating(0);
      setBody("");
      setFeedback("Tu reseña se ha retirado.");
      await refresh();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Revisa tu conexión.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section
      id="resenas"
      className="reviews-section"
      aria-labelledby="reviews-title"
    >
      <div className="detail-section-heading">
        <div>
          <p className="section-kicker">La experiencia de la comunidad</p>
          <h2 id="reviews-title">Reseñas y valoraciones</h2>
        </div>
        <span className="review-total">
          {summary.reviewCount}{" "}
          {summary.reviewCount === 1 ? "reseña" : "reseñas"}
        </span>
      </div>
      <div className="review-summary-panel">
        <div className="review-score">
          <strong>
            {summary.reviewCount ? summary.rating.toFixed(1) : "—"}
          </strong>
          <div>
            <RatingStars value={Math.round(summary.rating)} />
            <p>
              {summary.reviewCount
                ? "Valoración de la comunidad"
                : "Sé el primero en compartir tu experiencia"}
            </p>
          </div>
        </div>
        <ResourceMetrics {...summary} />
      </div>
      <div className="reviews-layout">
        <div className="review-list">
          {reviews.length ? (
            reviews.map((review) => (
              <article className="review-item" key={review.id}>
                <div className="review-person">
                  <span className="review-avatar" aria-hidden="true">
                    {review.username.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <strong>{review.username}</strong>
                    <time dateTime={review.createdAt}>
                      {reviewDate.format(new Date(review.createdAt))}
                    </time>
                  </div>
                  <RatingStars value={review.rating} />
                </div>
                <p>{review.body}</p>
              </article>
            ))
          ) : (
            <div className="reviews-empty">
              <UiIcon name="message" />
              <h3>Aquí empieza la conversación.</h3>
              <p>
                ¿Lo has probado? Cuenta qué te ha parecido para ayudar a otros a
                elegir.
              </p>
            </div>
          )}
        </div>
        <aside className="review-composer">
          {!loggedIn ? (
            <>
              <h3>Tu opinión cuenta.</h3>
              <p>
                Inicia sesión para valorar el recurso y compartir una reseña.
              </p>
              <Link className="action-button is-accent" href={`/login?returnTo=${encodeURIComponent(`/recurso/${resourceId}#resenas`)}`}>
                Iniciar sesión
              </Link>
              <Link className="text-link" href={`/register?returnTo=${encodeURIComponent(`/recurso/${resourceId}#resenas`)}`}>
                Crear una cuenta
              </Link>
            </>
          ) : canReview ? (
            <form onSubmit={submit} aria-busy={pending}>
              <h3>{own ? "Tu reseña" : "¿Qué te ha parecido?"}</h3>
              <p>
                Una opinión por cuenta. Las reseñas se revisan antes de
                aparecer.
              </p>
              <fieldset disabled={pending} className="rating-picker">
                <legend>Tu valoración</legend>
                {[1, 2, 3, 4, 5].map((value) => (
                  <label
                    key={value}
                    className={value <= rating ? "is-selected" : ""}
                  >
                    <input
                      type="radio"
                      name="rating"
                      value={value}
                      checked={rating === value}
                      onChange={() => setRating(value)}
                      required
                      aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
                    />
                    <UiIcon name="star" />
                  </label>
                ))}
              </fieldset>
              <label className="field">
                <span className="field-label">Tu experiencia</span>
                <textarea
                  name="review"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  minLength={8}
                  maxLength={1500}
                  rows={5}
                  required
                  disabled={pending}
                  placeholder="Qué te gustó, cómo lo usaste o qué mejorarías…"
                />
              </label>
              <small className="review-character-count">
                {body.length}/1500
              </small>
              {own && !own.approved ? (
                <p className="review-pending">
                  <UiIcon name="clock" />
                  Pendiente de revisión
                </p>
              ) : null}
              <button
                className="action-button is-accent"
                type="submit"
                disabled={pending}
              >
                {pending
                  ? "Guardando…"
                  : own
                    ? "Actualizar reseña"
                    : "Enviar reseña"}
              </button>
              {own ? (
                <button
                  className="text-link review-remove"
                  type="button"
                  onClick={remove}
                  disabled={pending}
                >
                  Retirar mi reseña
                </button>
              ) : null}
            </form>
          ) : (
            <>
              <UiIcon name="shield" />
              <h3>Tu publicación, sus opiniones.</h3>
              <p>
                Las valoraciones pertenecen a quienes prueban el recurso. Puedes
                revisar las reseñas desde la administración.
              </p>
              <Link className="text-link" href="/dashboard?view=reviews">
                Moderar reseñas
              </Link>
            </>
          )}
          {feedback ? (
            <p role="status" className="status-text is-ok">
              {feedback}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="status-text is-error">
              {error}
            </p>
          ) : null}
        </aside>
      </div>
      <p className="metrics-explanation">
        Las visitas y descargas se registran por navegador y día. Las cifras
        muestran actividad desde que se activaron los contadores; las descargas
        cuentan cuando se inician.
      </p>
    </section>
  );
}
