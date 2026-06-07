import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user?.role === "owner") {
    redirect("/admin");
  }

  if (user?.role === "client_admin") {
    redirect("/portal");
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">Client and owner access</p>
        <h1>Sign in to view chat conversations</h1>
        <p className="admin-intro">
          Company admins can view only their own website chats. The 3Beeez
          owner account can view all companies and manage the service.
        </p>
        <LoginForm />
        <Link className="login-link" href="/">
          Back to homepage
        </Link>
      </section>
    </main>
  );
}
