import nodemailer from "nodemailer";
import type { PurchaseOrderRecord } from "@/lib/db";

function getBaseUrl() {
  return process.env.APP_BASE_URL || "http://127.0.0.1:3000";
}

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<"sent" | "not_configured" | "failed"> {
  if (!isEmailConfigured()) return "not_configured";

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: "3Beeez — reset your password",
      text: [
        "You requested a password reset for your 3Beeez account.",
        "",
        `Click this link to set a new password (valid for 1 hour):`,
        resetUrl,
        "",
        "If you did not request this, ignore this email.",
      ].join("\n"),
    });
    return "sent";
  } catch {
    return "failed";
  }
}

export async function sendDeviceVerificationEmail(
  to: string,
  code: string
): Promise<"sent" | "not_configured" | "failed"> {
  if (!isEmailConfigured()) return "not_configured";

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: "3Beeez — verify your device",
      text: [
        "A sign-in was attempted from an unrecognised device.",
        "",
        `Your one-time verification code is: ${code}`,
        "",
        "This code expires in 15 minutes.",
        "",
        "If you did not attempt to sign in, change your password immediately.",
      ].join("\n"),
    });
    return "sent";
  } catch {
    return "failed";
  }
}

export async function sendPurchaseEmail(order: PurchaseOrderRecord) {
  if (!isEmailConfigured()) {
    return {
      status: "not_configured" as const,
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const loginUrl = `${getBaseUrl()}${order.loginUrl}`;
  const installedSiteUrl = `${getBaseUrl()}/test-site/${order.companySlug}/script-tag`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: order.adminEmail,
      subject: `3Beeez access for ${order.companyName}`,
      text: [
        `Hello ${order.contactName},`,
        "",
        `Your 3Beeez purchase is ready.`,
        `Plan: ${order.billingLabel}`,
        `Login URL: ${loginUrl}`,
        `Email: ${order.adminEmail}`,
        `Temporary password: ${order.tempPassword}`,
        "",
        "Add this script to your website:",
        order.scriptSnippet,
        "",
        `Installed site preview: ${installedSiteUrl}`,
        "",
        "You can now sign in, upload your documents and support history, and test the widget.",
      ].join("\n"),
    });

    return {
      status: "sent" as const,
    };
  } catch (error) {
    return {
      status: "failed" as const,
      message:
        error instanceof Error
          ? error.message
          : "SMTP delivery failed.",
    };
  }
}
