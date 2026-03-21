"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  submitPurchaseAction,
  type PurchaseFormState,
} from "@/app/purchase/actions";

type PurchaseFormProps = {
  defaultPlan: "monthly" | "annual";
};

const initialState: PurchaseFormState = {
  error: "",
  redirectUrl: undefined,
};

export function PurchaseForm({ defaultPlan }: PurchaseFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    submitPurchaseAction,
    initialState
  );

  useEffect(() => {
    if (state.redirectUrl) {
      router.push(state.redirectUrl);
    }
  }, [router, state.redirectUrl]);

  return (
    <form className="purchase-form" action={formAction}>
      <section className="purchase-section-card">
        <strong>Choose billing</strong>
        <div className="plan-selector">
          <label className="plan-option">
            <input
              defaultChecked={defaultPlan === "monthly"}
              name="planId"
              type="radio"
              value="monthly"
            />
            <span>Monthly - $70 per month</span>
          </label>
          <label className="plan-option">
            <input
              defaultChecked={defaultPlan === "annual"}
              name="planId"
              type="radio"
              value="annual"
            />
            <span>Annual one-time - $800</span>
          </label>
        </div>
      </section>

      <section className="purchase-section-card">
        <strong>Company details</strong>
        <div className="purchase-field-grid">
          <label className="login-label">
            <span>Company name</span>
            <input name="companyName" placeholder="Acme Support" required type="text" />
          </label>
          <label className="login-label">
            <span>Contact person</span>
            <input name="contactName" placeholder="Jane Doe" required type="text" />
          </label>
          <label className="login-label">
            <span>Admin email</span>
            <input
              name="adminEmail"
              placeholder="admin@company.com"
              required
              type="email"
            />
          </label>
          <label className="login-label">
            <span>Website URL</span>
            <input
              name="websiteUrl"
              placeholder="https://www.company.com"
              type="url"
            />
          </label>
        </div>
      </section>

      <section className="purchase-section-card">
        <strong>Chat icon color</strong>
        <div className="purchase-field-grid purchase-color-grid">
          <label className="login-label">
            <span>Select icon color</span>
            <input defaultValue="#5ae0d2" name="iconColor" type="color" />
          </label>
          <div className="purchase-note">
            Default color is the 3Beeez teal. The chosen color will be inserted
            into the script snippet we generate for the customer.
          </div>
        </div>
      </section>

      <section className="purchase-section-card">
        <strong>Payment details</strong>
        <div className="purchase-field-grid">
          <label className="login-label">
            <span>Cardholder name</span>
            <input name="cardholderName" placeholder="Jane Doe" required type="text" />
          </label>
          <label className="login-label">
            <span>Credit or debit card</span>
            <input
              name="cardNumber"
              placeholder="4242 4242 4242 4242"
              required
              type="text"
            />
          </label>
          <label className="login-label">
            <span>Expiry</span>
            <input name="expiry" placeholder="12/29" required type="text" />
          </label>
          <label className="login-label">
            <span>CVV</span>
            <input name="cvv" placeholder="123" required type="password" />
          </label>
        </div>
      </section>

      {state.error ? <p className="login-error">{state.error}</p> : null}

      <button className="button button-primary purchase-submit" type="submit">
        {isPending ? "Processing..." : "Complete mock purchase"}
      </button>
    </form>
  );
}
