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
        <p className="eyebrow">Client and owner access</p>
        <h1>Sign in to view chat conversations</h1>
        <p className="admin-intro">
          Company admins can view only their own website chats. The 3Beeez
          owner account can view all companies and manage the service.
        </p>
        {passwordReset && (
          <p className="portal-card-success" style={{ padding: "12px 16px", borderRadius: "8px", marginBottom: "8px" }}>
            Password reset successfully. Sign in with your new password.
          </p>
        )}
        <LoginForm />
        <Link className="login-link" href="/login/forgot-password">
          Forgot your password?
        </Link>
        <Link className="login-link" href="/">
          Back to homepage
        </Link>
      </section>
    </main>
  );
}
