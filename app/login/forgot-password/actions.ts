"use server";

import { findUserByEmail, createPasswordResetToken } from "@/lib/db";
import { sendPasswordResetEmail, isEmailConfigured } from "@/lib/email";

function getBaseUrl() {
  return process.env.APP_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";
}

export async function forgotPasswordAction(
  _prev: { sent: boolean; error: string },
  formData: FormData
): Promise<{ sent: boolean; error: string }> {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) return { sent: false, error: "Email address is required." };

  // Always show the same message whether the email exists or not (prevents enumeration)
  const user = findUserByEmail(email);

  if (user) {
    const token = createPasswordResetToken(user.id);
    const resetUrl = `${getBaseUrl()}/login/reset-password/${token}`;

    const result = await sendPasswordResetEmail(email, resetUrl);

    if (result === "not_configured") {
      // No SMTP — log the link so the server operator can recover access
      console.log(`[3Beeez] Password reset link for ${email} (SMTP not configured): ${resetUrl}`);
    } else if (result === "failed") {
      return { sent: false, error: "Failed to send the reset email. Please try again or contact support." };
    }
  }

  return { sent: true, error: "" };
}
