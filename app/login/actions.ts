"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentials, createUserSession, signOut } from "@/lib/auth";
import { checkRateLimit, recordFailure, clearFailures } from "@/lib/rate-limit";
import {
  createDeviceVerification,
  isTrustedDevice,
  maskEmail,
  trustDevice,
  verifyDeviceCode,
} from "@/lib/device-auth";
import { sendDeviceVerificationEmail, isEmailConfigured } from "@/lib/email";

export type LoginState =
  | { phase: "login"; error: string }
  | { phase: "verify"; userId: number; maskedEmail: string; fingerprint: string; error: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const fingerprint = String(formData.get("fingerprint") || "unknown");

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1";

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return {
      phase: "login",
      error: `Too many failed attempts. Try again in ${rateCheck.minutesUntilReset} minute${rateCheck.minutesUntilReset !== 1 ? "s" : ""}.`,
    };
  }

  const user = checkCredentials(email, password);
  if (!user) {
    recordFailure(ip);
    return { phase: "login", error: "Invalid email or password." };
  }

  clearFailures(ip);

  if (isTrustedDevice(user.id, fingerprint)) {
    await createUserSession(user.id);
    if (user.role === "owner") redirect("/admin");
    redirect("/portal");
  }

  const code = createDeviceVerification(user.id, fingerprint);

  if (isEmailConfigured()) {
    sendDeviceVerificationEmail(user.email, code).then((status) => {
      if (status === "failed") {
        console.error(`[3Beeez] OTP email failed for ${user.email} — check SMTP config`);
      }
    }).catch((err) => {
      console.error(`[3Beeez] OTP email error for ${user.email}:`, err);
    });
  } else {
    console.log(`[3Beeez] Device verification code for ${user.email}: ${code}`);
  }

  return {
    phase: "verify",
    userId: user.id,
    maskedEmail: maskEmail(user.email),
    fingerprint,
    error: "",
  };
}

export type VerifyState = {
  phase: "verify";
  userId: number;
  maskedEmail: string;
  fingerprint: string;
  error: string;
};

export async function verifyDeviceAction(
  _prev: VerifyState,
  formData: FormData
): Promise<VerifyState | never> {
  const userId = Number(formData.get("userId") || 0);
  const fingerprint = String(formData.get("fingerprint") || "unknown");
  const maskedEmail = String(formData.get("maskedEmail") || "");
  const code = String(formData.get("code") || "").trim();

  const base: VerifyState = { phase: "verify", userId, maskedEmail, fingerprint, error: "" };

  if (!userId || !code) {
    return { ...base, error: "Missing verification data. Please sign in again." };
  }

  const result = verifyDeviceCode(userId, fingerprint, code);
  if (!result.success) {
    const fatal =
      result.error?.includes("expired") ||
      result.error?.includes("not found") ||
      result.error?.includes("Too many");
    if (fatal) {
      return { phase: "verify", userId, maskedEmail, fingerprint, error: result.error ?? "Please sign in again." };
    }
    return { ...base, error: result.error ?? "Incorrect code." };
  }

  trustDevice(userId, fingerprint);
  const user = await createUserSession(userId);

  if (user.role === "owner") redirect("/admin");
  redirect("/portal");
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}
