"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { loginAction, verifyDeviceAction } from "@/app/login/actions";
import type { LoginState, VerifyState } from "@/app/login/actions";

// --- Fingerprint ---

function collectFingerprint(): string {
  try {
    const nav = window.navigator;
    const signals = [
      nav.language,
      nav.languages?.join(",") ?? "",
      String(nav.hardwareConcurrency ?? ""),
      String(screen.width),
      String(screen.height),
      String(screen.colorDepth),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      String(new Date().getTimezoneOffset()),
    ];
    // djb2 hash
    let hash = 5381;
    const str = signals.join("|");
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
      hash = hash >>> 0;
    }
    return hash.toString(16);
  } catch {
    return "unknown";
  }
}

// --- Icons ---

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

// --- Login phase ---

const loginInitial: LoginState = { phase: "login", error: "" };

function LoginPhase({ onVerify }: { onVerify: (state: VerifyState) => void }) {
  const [state, formAction, isPending] = useActionState(
    async (prev: LoginState, formData: FormData) => {
      const result = await loginAction(prev, formData);
      if (result.phase === "verify") {
        onVerify(result as VerifyState);
      }
      return result;
    },
    loginInitial
  );

  const [showPassword, setShowPassword] = useState(false);
  const fpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (fpRef.current) {
      fpRef.current.value = collectFingerprint();
    }
  }, []);

  return (
    <form className="login-form" action={formAction}>
      <input ref={fpRef} type="hidden" name="fingerprint" defaultValue="" />
      <label className="login-label">
        <span>Email</span>
        <input
          name="email"
          type="email"
          placeholder="admin@company.com"
          required
          autoComplete="email"
        />
      </label>
      <label className="login-label">
        <span>Password</span>
        <div className="login-password-wrap">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            className="login-password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
      </label>
      {state.error ? (
        <p className="login-error" role="alert">{state.error}</p>
      ) : null}
      <button className="button button-primary login-button" type="submit" disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

// --- Verify device phase ---

function VerifyPhase({ initial }: { initial: VerifyState }) {
  const [state, formAction, isPending] = useActionState(verifyDeviceAction, initial);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    codeRef.current?.focus();
  }, []);

  return (
    <div className="login-verify-wrap">
      <div className="login-verify-icon" aria-hidden="true">
        <ShieldIcon />
      </div>
      <h2 className="login-verify-heading">Verify your device</h2>
      <p className="login-verify-desc">
        We sent a 6-digit code to <strong>{state.maskedEmail}</strong>. Enter it below to continue.
      </p>
      <form className="login-form" action={formAction}>
        <input type="hidden" name="userId" value={state.userId} />
        <input type="hidden" name="fingerprint" value={state.fingerprint} />
        <input type="hidden" name="maskedEmail" value={state.maskedEmail} />
        <label className="login-label">
          <span>Verification code</span>
          <input
            ref={codeRef}
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            required
            autoComplete="one-time-code"
            className="login-otp-input"
          />
        </label>
        {state.error ? (
          <p className="login-error" role="alert">{state.error}</p>
        ) : null}
        <button className="button button-primary login-button" type="submit" disabled={isPending}>
          {isPending ? "Verifying…" : "Verify & sign in"}
        </button>
      </form>
      <p className="login-verify-note">
        Code expires in 15 minutes. Check your spam folder if you don&apos;t see it.
      </p>
    </div>
  );
}

// --- Exported form ---

export function LoginForm() {
  const [verifyState, setVerifyState] = useState<VerifyState | null>(null);

  if (verifyState) {
    return <VerifyPhase initial={verifyState} />;
  }

  return <LoginPhase onVerify={setVerifyState} />;
}
