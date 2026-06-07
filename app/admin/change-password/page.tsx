"use client";

import { useActionState } from "react";
import { changePasswordAction } from "./actions";

export default function ChangePasswordPage() {
  const [state, action, pending] = useActionState(changePasswordAction, {
    error: "",
    success: false,
  });

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">Account security</p>
            <h1>Change password</h1>
          </div>
          <a className="button button-secondary" href="/admin">Back to admin</a>
        </div>
      </section>

      <form action={action} style={{ maxWidth: "420px", marginTop: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <label className="login-label">
          Current password
          <input name="current" type="password" required autoComplete="current-password" />
        </label>
        <label className="login-label">
          New password
          <input name="next" type="password" required autoComplete="new-password" minLength={8} />
        </label>
        <label className="login-label">
          Confirm new password
          <input name="confirm" type="password" required autoComplete="new-password" />
        </label>

        {state.error && <p className="portal-card-error">{state.error}</p>}
        {state.success && (
          <p className="portal-card-success">Password updated successfully.</p>
        )}

        <button className="button button-primary" type="submit" disabled={pending || state.success}>
          {pending ? "Saving…" : "Update password"}
        </button>
      </form>
    </main>
  );
}
