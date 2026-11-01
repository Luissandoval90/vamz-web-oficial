"use client";
import { useEffect, useRef, useState } from "react";
import { OpinionComposer } from "@/components/opinion-composer";
import type { ResourceMetricsData } from "@/components/resource-metrics";
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
export type PublicComment = {
  id: string;
  body: string;
  username: string;
  createdAt: string;
  approved: boolean;
  isOwn: boolean;
  isAuthor: boolean;
};
type Props = {
  resourceId: string;
  initialSummary: ResourceMetricsData;
  initialReviews: PublicReview[];
  ownReview: PublicReview | null;
  initialComments: PublicComment[];
  initialCommentCount: number;
  loggedIn: boolean;
  canReview: boolean;
};
const date = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
function Stars({ value }: { value: number }) {
  return (
    <span
      className="rating-stars"
      role="img"
      aria-label={`${value} de 5 estrellas`}
    >
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
  ownReview,
  initialComments,
  initialCommentCount,
  loggedIn,
  canReview,
}: Props) {
  const [summary, setSummary] = useState(initialSummary);
  const [reviews, setReviews] = useState(initialReviews);
  const [own, setOwn] = useState(ownReview);
  const [comments, setComments] = useState(initialComments);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [filter, setFilter] = useState("all");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const counted = useRef(false);
  useEffect(() => {
    const count = () => {
      if (document.visibilityState !== "visible" || counted.current) return;
      counted.current = true;
      void fetch(`/api/resources/${resourceId}/stats`, { method: "POST" })
        .then((r) => (r.ok ? r.json() : null))
        .then((value) => {
          if (value) setSummary(value);
        })
        .catch(() => {});
    };
    count();
    document.addEventListener("visibilitychange", count);
    return () => document.removeEventListener("visibilitychange", count);
  }, [resourceId]);
  async function refresh(kind?: "comment" | "review") {
    const [reviewResponse, commentResponse] = await Promise.all([
      fetch(`/api/resources/${resourceId}/reviews`, { cache: "no-store" }),
      fetch(`/api/resources/${resourceId}/comments`, { cache: "no-store" }),
    ]);
    if (!reviewResponse.ok || !commentResponse.ok)
      throw Error("No se pudieron actualizar las opiniones.");
    const [reviewData, commentData] = await Promise.all([
      reviewResponse.json(),
      commentResponse.json(),
    ]);
    setReviews(reviewData.reviews);
    setOwn(reviewData.ownReview);
    setSummary(reviewData.summary);
    setComments(commentData.comments);
    setCommentCount(commentData.commentCount);
    if (kind) setFilter(kind);
  }
  async function removeComment(id: string) {
    if (pending) return;
    setPending(id);
    setError("");
    try {
      const response = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (!response.ok) throw Error("No se pudo retirar el comentario.");
      await refresh();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Revisa tu conexión.",
      );
    } finally {
      setPending(null);
    }
  }
  const visibleReviews =
    own && !reviews.some((row) => row.id === own.id)
      ? [own, ...reviews]
      : reviews;
  const entries = [
    ...comments.map((row) => ({ ...row, kind: "comment" as const, rating: 0 })),
    ...visibleReviews.map((row) => ({
      ...row,
      kind: "review" as const,
      isOwn: row.id === own?.id,
      isAuthor: false,
    })),
  ]
    .filter((row) => filter === "all" || row.kind === filter)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return (
    <section
      id="resenas"
      className="reviews-section"
      aria-labelledby="reviews-title"
    >
      <div className="detail-section-heading">
        <h2 id="reviews-title">Comentarios y reseñas</h2>
        <span className="review-total">
          {commentCount + summary.reviewCount} opiniones publicadas
        </span>
      </div>
      <div className="reviews-layout">
        <div className="review-list">
          <div
            className="discussion-filters"
            role="group"
            aria-label="Ver opiniones"
          >
            {[
              ["all", "Todas"],
              ["comment", "Comentarios"],
              ["review", "Reseñas"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {error ? (
            <p role="alert" className="status-text is-error">
              {error}
            </p>
          ) : null}
          {entries.length ? (
            entries.map((entry) => (
              <article
                className="review-item discussion-entry"
                key={entry.kind + entry.id}
              >
                <div className="review-person">
                  <span className="review-avatar" aria-hidden="true">
                    {entry.username.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <strong>
                      {entry.username}
                      {entry.isAuthor ? (
                        <span className="author-badge">Autor</span>
                      ) : null}
                    </strong>
                    <time dateTime={entry.createdAt}>
                      {date.format(new Date(entry.createdAt))}
                    </time>
                  </div>
                  {entry.kind === "review" ? (
                    <Stars value={entry.rating} />
                  ) : (
                    <span className="comment-type">
                      <UiIcon name="message" />
                    </span>
                  )}
                </div>
                <p>{entry.body}</p>
                {!entry.approved ? (
                  <span className="pending-opinion">
                    <UiIcon name="clock" />
                    Pendiente de revisión · Solo tú puedes verlo
                  </span>
                ) : null}
                {entry.kind === "comment" && entry.isOwn ? (
                  <button
                    type="button"
                    className="text-link discussion-remove"
                    disabled={pending !== null}
                    onClick={() => removeComment(entry.id)}
                  >
                    {pending === entry.id ? "Retirando…" : "Retirar comentario"}
                  </button>
                ) : null}
              </article>
            ))
          ) : (
            <p className="discussion-empty">
              Todavía no hay{" "}
              {filter === "review"
                ? "reseñas"
                : filter === "comment"
                  ? "comentarios"
                  : "opiniones"}{" "}
              en esta vista. Puedes iniciar la conversación aquí.
            </p>
          )}
        </div>
        <OpinionComposer
          resourceId={resourceId}
          loggedIn={loggedIn}
          canReview={canReview}
          ownReview={own}
          onRefresh={refresh}
        />
      </div>
    </section>
  );
}
