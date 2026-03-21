import Link from "next/link";
import { PurchaseForm } from "@/components/purchase-form";

type PurchasePageProps = {
  searchParams: Promise<{
    plan?: string;
  }>;
};

export default async function PurchasePage({ searchParams }: PurchasePageProps) {
  const { plan } = await searchParams;
  const defaultPlan = plan === "annual" ? "annual" : "monthly";

  return (
    <main className="purchase-shell">
      <section className="purchase-hero">
        <div>
          <p className="eyebrow">Purchase 3Beeez</p>
          <h1>Set up the customer account and generate the install script.</h1>
          <p className="admin-intro">
            This local checkout is a mock. It collects the company details,
            billing choice, payment fields, and icon color so we can generate a
            company login and script right away.
          </p>
        </div>
        <div className="purchase-side-card">
          <strong>Current offers</strong>
          <p>$70 per month for monthly billing</p>
          <p>$800 one-time for annual purchase</p>
          <p>
            After the mock payment completes, the customer gets login details,
            a dedicated login URL, and a ready-to-install widget script.
          </p>
          <Link className="button button-secondary" href="/">
            Back to homepage
          </Link>
        </div>
      </section>

      <PurchaseForm defaultPlan={defaultPlan} />
    </main>
  );
}
