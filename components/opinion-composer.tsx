"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { UiIcon } from "@/components/ui-icon";
import type { PublicReview } from "@/components/resource-reviews";
export function OpinionComposer({
  resourceId,
  loggedIn,
  canReview,
  ownReview,
  onRefresh,
}: {
  resourceId: string;
  loggedIn: boolean;
  canReview: boolean;
  ownReview: PublicReview | null;
  onRefresh: (kind?: "comment" | "review") => Promise<void>;
}) {
  const [mode, setMode] = useState<"comment" | "review">("comment");
  const [commentBody, setCommentBody] = useState("");
  const [reviewBody, setReviewBody] = useState(ownReview?.body ?? "");
  const [rating, setRating] = useState(ownReview?.rating ?? 0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const firstStar = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const body = mode === "comment" ? commentBody : reviewBody;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    setFeedback("");
    if (mode === "review" && !rating) {
      setError("Elige de 1 a 5 estrellas para enviar tu reseña.");
      firstStar.current?.focus();
      return;
    }
    if (body.trim().length < (mode === "comment" ? 2 : 8)) {
      setError(
        mode === "comment"
          ? "Escribe al menos 2 caracteres para comentar."
          : "Describe tu experiencia en al menos 8 caracteres.",
      );
      textarea.current?.focus();
      return;
    }
    setPending(true);
    let saved = false;
    try {
      const response = await fetch(
        `/api/resources/${resourceId}/${mode === "comment" ? "comments" : "reviews"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "comment" ? { body } : { body, rating },
          ),
        },
      );
      const result = await response.json().catch(() => ({
        error: "No se pudo leer la respuesta del servidor. Inténtalo de nuevo.",
      }));
      if (!response.ok)
        throw Error(
          response.status === 401
            ? "Tu sesión ha caducado. Vuelve a iniciar sesión."
            : result.error || "No se pudo enviar tu opinión.",
        );
      saved = true;
      if (mode === "comment") setCommentBody("");
      setFeedback(result.message);
      await onRefresh(mode);
    } catch (failure) {
      setError(
        saved
          ? "Tu opinión se envió, pero no se pudo actualizar la lista. Recarga la página para verla."
          : failure instanceof Error
            ? failure.message
            : "Revisa tu conexión e inténtalo de nuevo.",
      );
    } finally {
      setPending(false);
    }
  }
  async function removeReview() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/resources/${resourceId}/reviews`, {
        method: "DELETE",
      });
      if (!response.ok) throw Error("No se pudo retirar la reseña.");
      setRating(0);
      setReviewBody("");
      setFeedback("Reseña retirada.");
      await onRefresh();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Revisa tu conexión.",
      );
    } finally {
      setPending(false);
    }
  }
  if (!loggedIn)
    return (
      <aside className="review-composer">
        <h3>Participa en la conversación.</h3>
        <p>Inicia sesión para comentar o compartir una reseña.</p>
        <Link
          className="action-button is-accent"
          href={`/login?returnTo=${encodeURIComponent(`/recurso/${resourceId}#resenas`)}`}
        >
          Iniciar sesión
        </Link>
        <Link
          className="text-link"
          href={`/register?returnTo=${encodeURIComponent(`/recurso/${resourceId}#resenas`)}`}
        >
          Crear una cuenta
        </Link>
      </aside>
    );
  return (
    <aside className="review-composer">
      <form onSubmit={submit} noValidate aria-busy={pending}>
        <h3>Comparte tu experiencia.</h3>
        <div
          className="opinion-modes"
          role="group"
          aria-label="Tipo de opinión"
        >
          <button
            type="button"
            aria-pressed={mode === "comment"}
            disabled={pending}
            onClick={() => {
              setMode("comment");
              setError("");
              setFeedback("");
            }}
          >
            <UiIcon name="message" />
            Comentario
          </button>
          <button
            type="button"
            aria-pressed={mode === "review"}
            disabled={pending || !canReview}
            title={
              !canReview
                ? "El autor puede comentar, pero no puntuar su propia publicación."
                : undefined
            }
            onClick={() => {
              setMode("review");
              setError("");
              setFeedback("");
            }}
          >
            <UiIcon name="star" />
            Reseña
          </button>
        </div>
        <p className="opinion-hint">
          {mode === "comment"
            ? "Comenta sin elegir estrellas. Tus mensajes aparecen aquí mientras se revisan."
            : "Valora de 1 a 5 estrellas y cuenta cómo te fue. Una reseña por cuenta."}
        </p>
        {!canReview ? (
          <p className="opinion-author-note">
            Puedes responder como autor. La puntuación corresponde a otros
            miembros.
          </p>
        ) : null}
        {error ? (
          <p id="opinion-error" role="alert" className="status-text is-error">
            {error}
          </p>
        ) : null}
        {mode === "review" ? (
          <fieldset disabled={pending} className="rating-picker">
            <legend>Tu valoración</legend>
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                className={value <= rating ? "is-selected" : ""}
              >
                <input
                  ref={value === 1 ? firstStar : undefined}
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => {
                    setRating(value);
                    setError("");
                  }}
                  required
                  aria-describedby={error ? "opinion-error" : undefined}
                  aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
                />
                <UiIcon name="star" />
              </label>
            ))}
          </fieldset>
        ) : null}
        <label className="field">
          <span className="field-label">Tu experiencia</span>
          <textarea
            ref={textarea}
            name="opinion"
            value={body}
            onChange={(event) =>
              mode === "comment"
                ? setCommentBody(event.target.value)
                : setReviewBody(event.target.value)
            }
            rows={4}
            minLength={mode === "comment" ? 2 : 8}
            maxLength={1500}
            required
            disabled={pending}
            aria-describedby={error ? "opinion-error" : undefined}
            placeholder={
              mode === "comment"
                ? "Haz una pregunta o comparte tu experiencia…"
                : "Qué te gustó y cómo lo usaste…"
            }
          />
        </label>
        <small className="review-character-count">{body.length}/1500</small>
        {feedback ? (
          <p role="status" className="status-text is-ok">
            {feedback}
          </p>
        ) : null}
        <button
          className="action-button is-accent"
          type="submit"
          disabled={pending}
        >
          {pending
            ? "Enviando…"
            : mode === "comment"
              ? "Enviar comentario"
              : ownReview
                ? "Actualizar reseña"
                : "Enviar reseña"}
          <UiIcon name="arrow" />
        </button>
        {mode === "review" && ownReview ? (
          <>
            <p className="review-pending">
              {ownReview.approved
                ? "Tu reseña está publicada."
                : "Tu reseña está pendiente de revisión."}
            </p>
            <button
              type="button"
              className="text-link review-remove"
              onClick={removeReview}
              disabled={pending}
            >
              Retirar mi reseña
            </button>
          </>
        ) : null}
      </form>
    </aside>
  );
}
