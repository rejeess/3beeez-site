"use server";

import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { findUserByEmail, updateUserPassword, verifyPassword } from "@/lib/db";

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

  if (next.length < 8) {
    return { error: "New password must be at least 8 characters.", success: false };
  }

  if (next !== confirm) {
    return { error: "New passwords do not match.", success: false };
  }

  const full = findUserByEmail(user.email);
  if (!full || !verifyPassword(current, full.passwordHash)) {
    return { error: "Current password is incorrect.", success: false };
  }

  updateUserPassword(user.id, next);
  redirect("/admin");
}
