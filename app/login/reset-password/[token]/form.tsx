"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "./actions";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, {
    error: "",
    success: false,
  });

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">Account recovery</p>
        <h1>Set a new password</h1>

        <form action={action} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
          <input type="hidden" name="token" value={token} />

          <label className="login-label">
            New password
            <input name="next" type="password" required autoComplete="new-password" minLength={8} />
            <small style={{ color: "var(--color-muted, #888)", marginTop: "4px" }}>
              Min 8 characters, uppercase, lowercase, and a number or symbol.
            </small>
          </label>

          <label className="login-label">
            Confirm new password
            <input name="confirm" type="password" required autoComplete="new-password" />
          </label>

          {state.error && <p className="portal-card-error">{state.error}</p>}

          <button className="button button-primary login-button" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Set new password"}
          </button>
        </form>
      </section>
    </main>
  );
}
