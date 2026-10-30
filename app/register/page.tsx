import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { PublicFrame } from "@/components/public-frame";
import { getCurrentUser } from "@/lib/server-auth";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <PublicFrame>
      <main id="contenido" className="page-shell auth-shell">
        <div className="auth-form-wrap animate-up">
          <AuthForm mode="register" />
        </div>
      </main>
    </PublicFrame>
  );
}
