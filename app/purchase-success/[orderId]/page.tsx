import Link from "next/link";
import { notFound } from "next/navigation";
import { getPurchaseOrder } from "@/lib/db";

type PurchaseSuccessPageProps = {
  params: Promise<{
    orderId: string;
  }>;
  searchParams: Promise<{
    emailStatus?: string;
    emailMessage?: string;
  }>;
};

export default async function PurchaseSuccessPage({
  params,
  searchParams,
}: PurchaseSuccessPageProps) {
  const { orderId } = await params;
  const { emailStatus, emailMessage } = await searchParams;
  const order = getPurchaseOrder(orderId);

  if (!order) {
    notFound();
  }

  return (
    <main className="purchase-shell">
      <section className="login-card">
        <p className="eyebrow">Mock purchase complete</p>
        <h1>{order.companyName} is ready to onboard.</h1>
        <div className="purchase-mode-banner">
          <strong>
            {emailStatus === "sent"
              ? "Real email sent to the customer"
              : emailStatus === "failed"
                ? "Account created, but email delivery failed"
              : "Mock delivery shown on this page"}
          </strong>
          <p>
            {emailStatus === "sent"
              ? "SMTP was configured, so the login details and install script were sent to the real email address entered in the purchase form."
              : emailStatus === "failed"
                ? `The account and script were created, but SMTP delivery failed. ${emailMessage || "Please check your SMTP settings and inbox spam folder."}`
              : "SMTP is not configured yet, so this page is acting as the delivery email preview after payment."}
          </p>
        </div>

        <div className="purchase-result-grid">
          <article className="test-site-card">
            <strong>Purchase summary</strong>
            <p>Plan: {order.billingLabel}</p>
            <p>Company: {order.companyName}</p>
            <p>Admin email: {order.adminEmail}</p>
            <p>Card used: ending in {order.cardLast4}</p>
            <p>Icon color: <code>{order.iconColor}</code></p>
          </article>

          <article className="test-site-card">
            <strong>Login details</strong>
            <p>Dedicated login URL: <code>{order.loginUrl}</code></p>
            <p>Email: <code>{order.adminEmail}</code></p>
            {emailStatus !== "sent" && (
              <p>Temporary password: <code>{order.tempPassword}</code></p>
            )}
            <div className="purchase-actions">
              <Link
                className="button button-primary"
                href={order.loginUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open login page
              </Link>
              <Link
                className="button button-secondary"
                href={`/test-site/${order.companySlug}/script-tag`}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open installed website
              </Link>
            </div>
          </article>
        </div>

        <div className="purchase-script-card">
          <strong>Script to add to the customer website</strong>
          <pre><code>{order.scriptSnippet}</code></pre>
          <div className="install-instructions">
            <strong>Where to place this script</strong>
            <ol className="install-steps">
              <li>Open the HTML template or layout file used across the website.</li>
              <li>Paste the script near the end of the page, just before the closing `&lt;/body&gt;` tag.</li>
              <li>Publish the website changes and refresh the site.</li>
              <li>The 3Beeez chat icon should appear in the bottom-right corner.</li>
            </ol>
            <p>
              If the site uses WordPress, Shopify, Webflow, or another builder,
              place the script in the global footer/custom code area so it loads
              on every page.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
