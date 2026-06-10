import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ passwordReset?: string }>;
}) {
  const user = await getCurrentUser();

  if (user?.role === "owner") redirect("/admin");
  if (user?.role === "client_admin") redirect("/portal");

  const { passwordReset } = await searchParams;

  return (
    <main className="login-shell">
      <section className="login-card">
        <h1>Turn conversations into customer insights</h1>
        <p className="admin-intro">
          Access chat history, manage your AI knowledge base, identify
          high-quality leads, and monitor chatbot performance.
        </p>
        {passwordReset && (
          <p className="portal-card-success" style={{ padding: "12px 16px", borderRadius: "8px", marginBottom: "8px" }}>
            Password reset successfully. Sign in with your new password.
          </p>
        )}
        <LoginForm />
        <div className="login-links">
          <Link className="login-link" href="/login/forgot-password">
            Forgot your password?
          </Link>
          <Link className="login-link" href="/">
            Back to homepage
          </Link>
        </div>
      </section>
    </main>
  );
}
