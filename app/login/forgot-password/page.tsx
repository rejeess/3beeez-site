"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction } from "./actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPasswordAction, {
    sent: false,
    error: "",
  });

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">Account recovery</p>
        <h1>Forgot your password?</h1>
        <p className="admin-intro">
          Enter your email address and we will send you a link to reset your password.
        </p>

        {state.sent ? (
          <>
            <p className="portal-card-success" style={{ padding: "12px 16px", borderRadius: "8px" }}>
              If that email is registered, a reset link has been sent. Check your inbox (and spam folder).
            </p>
            <Link className="login-link" href="/login">Back to sign in</Link>
          </>
        ) : (
          <form action={action} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <label className="login-label">
              Email address
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>

            {state.error && <p className="portal-card-error">{state.error}</p>}

            <button className="button button-primary login-button" type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </button>

            <Link className="login-link" href="/login">Back to sign in</Link>
          </form>
        )}
      </section>
    </main>
  );
}
