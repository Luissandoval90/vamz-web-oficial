"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className = "action-button is-dark" }: LogoutButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    setError(null);

    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (!response.ok) {
      setError("No se pudo cerrar la sesion. Intenta otra vez.");
      return;
    }

    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <>
      <button
        className={className}
        type="button"
        onClick={handleLogout}
        disabled={isPending}
      >
        {isPending ? "Saliendo..." : "Cerrar sesion"}
      </button>
      {error ? <p className="status-text is-error">{error}</p> : null}
    </>
  );
}
