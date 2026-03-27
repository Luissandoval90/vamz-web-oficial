"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ProfileFormProps = {
  email: string;
  initialUsername: string;
};

export function ProfileForm({ email, initialUsername }: ProfileFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/profile/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    const result = (await response.json().catch(() => null)) as
      | {
          error?: string;
          user?: {
            username?: string;
          };
        }
      | null;

    if (!response.ok) {
      setError(result?.error ?? "No se pudo actualizar el nombre de usuario.");
      return;
    }

    setUsername(result?.user?.username ?? username);
    setSuccess("Nombre de usuario actualizado.");

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <form className="panel-card profile-form-card" onSubmit={handleSubmit}>
      <div className="section-heading">
        <p className="section-kicker">Perfil</p>
        <h2 className="section-title-sm">Editar nombre de usuario</h2>
      </div>

      <div className="form-grid">
        <label className="field" htmlFor="profile-username">
          <span className="field-label">Nombre visible</span>
          <input
            id="profile-username"
            name="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Tu nombre de usuario"
            minLength={3}
            maxLength={32}
            required
          />
        </label>
      </div>

      <p className="body-copy">
        Correo actual: <strong>{email}</strong>
      </p>

      <div className="inline-actions">
        <button className="action-button is-accent" type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
        <span className="inline-note">Puedes usar letras, numeros, espacios, puntos y guiones.</span>
      </div>

      {error ? <p className="status-text is-error">{error}</p> : null}
      {success ? <p className="status-text is-ok">{success}</p> : null}
    </form>
  );
}
