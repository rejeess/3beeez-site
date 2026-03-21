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
  const installedSiteUrl = `${getBaseUrl()}/test-site/${order.companySlug}/installed`;

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
