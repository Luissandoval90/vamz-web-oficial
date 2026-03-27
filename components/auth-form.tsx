"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
  const submitLabel = mode === "login" ? "Entrar" : "Crear cuenta";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      ...(mode === "register"
        ? { username: String(formData.get("username") ?? "") }
        : {}),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(result?.error ?? "No se pudo procesar la solicitud.");
      return;
    }

    startTransition(() => {
      router.push("/");
      router.refresh();
    });
  };

  return (
    <section className="auth-card">
      <div className="section-heading">
        <p className="section-kicker">{mode === "login" ? "Acceso" : "Registro"}</p>
        <h1 className="page-title page-title-sm">
          {mode === "login" ? "Acceso a tu cuenta" : "Tu cuenta nueva"}
        </h1>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        {mode === "register" ? (
          <label className="field">
            <span className="field-label">Nombre de usuario</span>
            <input
              className="input"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Tu nombre dentro del sitio"
              minLength={3}
              maxLength={32}
              required
            />
          </label>
        ) : null}

        <label className="field">
          <span className="field-label">Email</span>
          <input
            className="input"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Contrasena</span>
          <input
            className="input"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="Minimo 8 caracteres"
            required
          />
        </label>

        {error ? <p className="status-text is-error">{error}</p> : null}

        <button className="action-button is-accent form-submit" type="submit" disabled={isPending}>
          {isPending ? "Procesando..." : submitLabel}
        </button>
      </form>

    </section>
  );
}
