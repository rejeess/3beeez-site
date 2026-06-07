"use server";

import { findPasswordResetToken, consumePasswordResetToken, updateUserPassword } from "@/lib/db";
import { validatePasswordStrength } from "@/lib/password";
import { redirect } from "next/navigation";

export async function resetPasswordAction(
  _prev: { error: string; success: boolean },
  formData: FormData
): Promise<{ error: string; success: boolean }> {
  const token = String(formData.get("token") || "");
  const next = String(formData.get("next") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!token) return { error: "Invalid or missing reset token.", success: false };
  if (!next || !confirm) return { error: "All fields are required.", success: false };

  const strengthError = validatePasswordStrength(next);
  if (strengthError) return { error: strengthError, success: false };

  if (next !== confirm) return { error: "Passwords do not match.", success: false };

  const record = findPasswordResetToken(token);

  if (!record) return { error: "This reset link is invalid or has already been used.", success: false };

  if (new Date(record.expiresAt) <= new Date()) {
    return { error: "This reset link has expired. Please request a new one.", success: false };
  }

  consumePasswordResetToken(token);
  updateUserPassword(record.userId, next);

  redirect("/login?passwordReset=1");
}
