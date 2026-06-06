import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/db";

type PurchaseDemoPageProps = {
  params: Promise<{
    companySlug: string;
  }>;
  searchParams: Promise<{
    plan?: string;
    mode?: string;
  }>;
};

export default async function PurchaseDemoPage({
  params,
  searchParams,
}: PurchaseDemoPageProps) {
  const { companySlug } = await params;
  const { plan = "starter" } = await searchParams;
  const company = getCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">Payment success mock</p>
        <h1>{company.name} service activation</h1>
        <p className="admin-intro">
          This page simulates what the client receives after payment: embed
          setup details, client admin login, and onboarding instructions for
          uploading documents or previous support history.
        </p>

        <div className="purchase-mode-banner">
          <strong>Local mock checkout completed</strong>
          <p>
            This is the local success state after selecting a purchase option on
            3beeez.com. In production, `/checkout` should redirect to a real
            payment provider before landing here or a similar success page.
          </p>
        </div>

        <div className="login-demo-card">
          <strong>What the client receives</strong>
          <p>
            Purchased plan: <code>{plan}</code>
          </p>
          <p>
            Admin login: <code>admin@acme-support.com</code> /{" "}
            <code>AcmePortal!2026</code>
          </p>
          <p>
            Bot ID: <code>{company.botId}</code>
          </p>
          <p>
            Portal access: <code>/portal</code>
          </p>
          <p>
            Test site: <code>{`/test-site/${company.slug}`}</code>
          </p>
          <p>
            Installed site preview: <code>{`/test-site/${company.slug}/script-tag`}</code>
          </p>
        </div>

        <div className="test-site-grid">
          <article className="test-site-card">
            <strong>Onboarding tasks for the company admin</strong>
            <ul className="test-site-list">
              <li>Upload FAQ, policy, and product documents</li>
              <li>Add website notes and implementation links</li>
              <li>Paste previous support history for better answers</li>
            </ul>
          </article>

          <article className="test-site-card">
            <strong>Demo links</strong>
            <div className="purchase-actions">
              <Link className="button button-primary" href="/login">
                Login as client admin
              </Link>
              <Link className="button button-secondary" href={`/test-site/${company.slug}`}>
                Open normal website
              </Link>
              <Link
                className="button button-secondary"
                href={`/test-site/${company.slug}/script-tag`}
              >
                Open installed website
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
