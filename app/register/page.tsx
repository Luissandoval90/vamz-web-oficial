import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { PublicFrame } from "@/components/public-frame";
import { getCurrentUser } from "@/lib/server-auth";
import { safeReturnPath } from "@/lib/return-path";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const user = await getCurrentUser();
  const returnTo = safeReturnPath((await searchParams).returnTo);

  if (user) {
    redirect(returnTo || "/recursos");
  }

  return (
    <PublicFrame>
      <main id="contenido" className="page-shell auth-shell">
        <div className="auth-form-wrap animate-up">
          <AuthForm mode="register" returnTo={returnTo} />
        </div>
      </main>
    </PublicFrame>
  );
}
