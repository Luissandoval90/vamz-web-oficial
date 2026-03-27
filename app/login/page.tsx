import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/server-auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="page-shell auth-shell">
      <div className="auth-form-wrap animate-up">
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
