"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";

const initialState = {
  error: "",
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <form className="login-form" action={formAction}>
      <label className="login-label">
        <span>Email</span>
        <input
          name="email"
          type="email"
          placeholder="admin@company.com"
          required
        />
      </label>
      <label className="login-label">
        <span>Password</span>
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
        />
      </label>
      {state.error ? <p className="login-error">{state.error}</p> : null}
      <button className="button button-primary login-button" type="submit">
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
