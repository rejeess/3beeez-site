"use server";

import { createPurchaseOrder } from "@/lib/db";
import { sendPurchaseEmail } from "@/lib/email";

export type PurchaseFormState = {
  error: string;
  redirectUrl?: string;
};

export async function submitPurchaseAction(
  _previousState: PurchaseFormState,
  formData: FormData
) {
  const planId = String(formData.get("planId") || "monthly");
  const billingLabel =
    planId === "annual" ? "Annual one-time - $800" : "Monthly - $70";
  const companyName = String(formData.get("companyName") || "").trim();
  const contactName = String(formData.get("contactName") || "").trim();
  const adminEmail = String(formData.get("adminEmail") || "").trim();
  const websiteUrl = String(formData.get("websiteUrl") || "").trim();
  const iconColor = String(formData.get("iconColor") || "#5ae0d2").trim();
  const cardNumber = String(formData.get("cardNumber") || "").trim();
  const expiry = String(formData.get("expiry") || "").trim();
  const cvv = String(formData.get("cvv") || "").trim();

  if (
    !companyName ||
    !contactName ||
    !adminEmail ||
    !cardNumber ||
    !expiry ||
    !cvv
  ) {
    return {
      error: "Please complete all required purchase and payment fields.",
    };
  }

  try {
    const order = createPurchaseOrder({
      planId,
      billingLabel,
      companyName,
      contactName,
      adminEmail,
      websiteUrl,
      iconColor,
      cardNumber,
    });

    if (!order) {
      return { error: "We could not complete the mock purchase." };
    }

    const emailResult = await sendPurchaseEmail(order);
    const successUrl = new URL(
      `/purchase-success/${order.publicId}`,
      "http://local"
    );
    successUrl.searchParams.set("emailStatus", emailResult.status);

    if ("message" in emailResult && emailResult.message) {
      successUrl.searchParams.set("emailMessage", emailResult.message);
    }

    return {
      error: "",
      redirectUrl: `${successUrl.pathname}${successUrl.search}`,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to complete the mock purchase.",
    };
  }
}
