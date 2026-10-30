"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UiIcon } from "@/components/ui-icon";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const login = mode === "login";
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch(
        login ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(!login
              ? { username: String(formData.get("username") ?? "") }
              : {}),
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
          }),
        },
      );
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(
          result?.error ??
            "No pudimos procesar tu solicitud. Inténtalo de nuevo.",
        );
      router.push("/");
      router.refresh();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.",
      );
      setPending(false);
    }
  };
  return (
    <section className="auth-card">
      <div className="section-heading">
        <p className="section-kicker">
          {login ? "QUÉ BUENO VERTE DE NUEVO" : "UN NUEVO COMIENZO"}
        </p>
        <h1 className="page-title">
          {login ? "Vuelve a tu mundo." : "Hazlo parte de ti."}
        </h1>
        <p>
          {login
            ? "Inicia sesión con tu cuenta de VAMZ."
            : "Crea tu cuenta y entra al universo de VAMZ."}
        </p>
      </div>
      <form className="form-grid" onSubmit={handleSubmit} aria-busy={pending}>
        {!login ? (
          <label className="field">
            <span className="field-label">Nombre de usuario</span>
            <input
              name="username"
              type="text"
              autoComplete="username"
              spellCheck={false}
              placeholder="¿Cómo te llamamos?"
              minLength={3}
              maxLength={32}
              required
              disabled={pending}
            />
          </label>
        ) : null}
        <label className="field">
          <span className="field-label">Correo electrónico</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="tu@correo.com"
            required
            disabled={pending}
          />
        </label>
        <div className="field">
          <label className="field-label" htmlFor="auth-password">
            Contraseña
          </label>
          <span className="password-field">
            <input
              id="auth-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={login ? "current-password" : "new-password"}
              placeholder={login ? "Tu contraseña" : "Al menos 8 caracteres"}
              minLength={login ? undefined : 8}
              maxLength={128}
              required
              disabled={pending}
              aria-describedby={!login ? "password-help" : undefined}
            />
            <button
              className="password-toggle"
              type="button"
              aria-pressed={showPassword}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </span>
          {!login ? (
            <span className="inline-note" id="password-help">
              Usa al menos 8 caracteres.
            </span>
          ) : null}
        </div>
        {error ? (
          <p className="status-text is-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          className="action-button is-accent form-submit"
          type="submit"
          disabled={pending}
        >
          {pending
            ? "Procesando…"
            : login
              ? "Iniciar sesión"
              : "Crear mi cuenta"}
          <UiIcon name="arrow" />
        </button>
      </form>
      <p className="auth-switch">
        {login ? "¿Todavía no tienes cuenta?" : "¿Ya eres parte?"}{" "}
        <Link href={login ? "/register" : "/login"}>
          {login ? "Crea una cuenta" : "Inicia sesión"}
        </Link>
      </p>
    </section>
  );
}
