import { notFound } from "next/navigation";
import { findPasswordResetToken } from "@/lib/db";
import ResetPasswordForm from "./form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const record = findPasswordResetToken(token);

  if (!record) notFound();

  if (new Date(record.expiresAt) <= new Date()) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <p className="eyebrow">Link expired</p>
          <h1>This reset link has expired</h1>
          <p className="admin-intro">Reset links are valid for 1 hour. Please request a new one.</p>
          <a className="button button-primary" href="/login/forgot-password">Request new link</a>
        </section>
      </main>
    );
  }

  return <ResetPasswordForm token={token} />;
}
