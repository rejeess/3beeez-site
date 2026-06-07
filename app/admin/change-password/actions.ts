"use server";

import { requireOwner } from "@/lib/auth";
import { findUserByEmail, updateUserPassword, verifyPassword } from "@/lib/db";
import { validatePasswordStrength } from "@/lib/password";

export async function changePasswordAction(
  _prev: { error: string; success: boolean },
  formData: FormData
): Promise<{ error: string; success: boolean }> {
  const user = await requireOwner();

  const current = String(formData.get("current") || "");
  const next = String(formData.get("next") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!current || !next || !confirm) {
    return { error: "All fields are required.", success: false };
  }

  const strengthError = validatePasswordStrength(next);
  if (strengthError) return { error: strengthError, success: false };

  if (next !== confirm) {
    return { error: "New passwords do not match.", success: false };
  }

  const full = findUserByEmail(user.email);
  if (!full || !verifyPassword(current, full.passwordHash)) {
    return { error: "Current password is incorrect.", success: false };
  }

  updateUserPassword(user.id, next);
  return { error: "", success: true };
}
