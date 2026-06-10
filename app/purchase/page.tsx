import type { Metadata } from "next";
import Link from "next/link";
import { PurchaseForm } from "@/components/purchase-form";

export const metadata: Metadata = {
  title: "Get Started | 3Beeez",
  description:
    "Set up your 3Beeez AI chat widget in minutes. Choose a plan, enter your details, and get your embed script instantly.",
  openGraph: {
    title: "Get Started | 3Beeez",
    description:
      "Set up your 3Beeez AI chat widget in minutes. Choose a plan, enter your details, and get your embed script instantly.",
  },
};

type PurchasePageProps = {
  searchParams: Promise<{
    plan?: string;
    invite?: string;
  }>;
};

export default async function PurchasePage({ searchParams }: PurchasePageProps) {
  const { plan, invite } = await searchParams;
  const defaultPlan = plan === "annual" ? "annual" : "monthly";

  const requiredCode = process.env.PURCHASE_INVITE_CODE;
  const isLocked = requiredCode && invite !== requiredCode;

  if (isLocked) {
    return (
      <main className="purchase-shell">
        <section className="purchase-hero">
          <div>
            <p className="eyebrow">3Beeez</p>
            <h1>Registration is currently by invitation only.</h1>
            <p className="admin-intro">
              We are onboarding new customers on a limited basis. If you have an
              invitation link, please use it to access the sign-up form.
            </p>
            <Link className="button button-secondary" href="/">
              Back to homepage
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="purchase-shell">
      <section className="purchase-hero">
        <div>
          <p className="eyebrow">Purchase 3Beeez</p>
          <h1>Set up your account and get your install script.</h1>
          <p className="admin-intro">
            Fill in your company details and billing choice. You will receive a
            client portal login and a ready-to-install widget script immediately.
          </p>
        </div>
        <div className="purchase-side-card">
          <strong>Current offers</strong>
          <p>$70 per month for monthly billing</p>
          <p>$800 one-time for annual purchase</p>
          <p>
            After completing the form, your account is created instantly with a
            dedicated login URL and embeddable chat script.
          </p>
          <Link className="button button-secondary" href="/">
            Back to homepage
          </Link>
        </div>
      </section>

      <PurchaseForm defaultPlan={defaultPlan} inviteCode={invite ?? ""} />
    </main>
  );
}
