import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/db";

type ScriptTagTestPageProps = {
  params: Promise<{
    companySlug: string;
  }>;
};

export default async function ScriptTagTestPage({
  params,
}: ScriptTagTestPageProps) {
  if (process.env.NODE_ENV !== "development") notFound();

  const { companySlug } = await params;
  const company = getCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  const scriptSrc = `/widget-script?installToken=${encodeURIComponent(
    company.installToken
  )}&position=bottom-right&theme=midnight&iconColor=%235ae0d2`;
  const scriptTag = `<script src="${scriptSrc}" async></script>`;

  return (
    <>
      <main className="test-site-shell">
        <section className="test-site-hero">
          <div>
            <p className="eyebrow">Script tag test</p>
            <h1>{company.name} website with script installed</h1>
            <p className="admin-intro">
              This page behaves like a customer website after the 3Beeez chat
              script has been added. The floating chat button should appear
              automatically in the bottom-right corner.
            </p>
          </div>
          <div className="test-site-code">
            <strong>Installed script tag</strong>
            <pre>
              <code>{scriptTag}</code>
            </pre>
          </div>
        </section>

        <section className="test-site-grid">
          <article className="test-site-card">
            <strong>What to verify</strong>
            <ul className="test-site-list">
              <li>The chat launcher appears without clicking an install button</li>
              <li>The launcher opens the embedded chat iframe</li>
              <li>Messages are sent using this company&apos;s bot ID</li>
              <li>Conversation history appears in the admin area</li>
            </ul>
          </article>

          <article className="test-site-card">
            <strong>Compare install states</strong>
            <p>
              Use these pages to compare the customer journey before install,
              manual install testing, and the final script-tag installation.
            </p>
            <div className="purchase-actions">
              <Link
                className="button button-secondary"
                href={`/test-site/${company.slug}`}
              >
                Before install
              </Link>
              <Link
                className="button button-secondary"
                href={`/test-site/${company.slug}/installed`}
              >
                Manual install
              </Link>
              <Link className="button button-primary" href="/admin">
                View admin chats
              </Link>
            </div>
          </article>
        </section>

        <section className="test-site-grid">
          <article className="test-site-card">
            <strong>Sample customer content</strong>
            <p>
              Visitors can browse normal service information while the chat
              widget stays available across the page. Ask about returns,
              onboarding, documents, or website embedding to test the current
              demo responses.
            </p>
          </article>

          <article className="test-site-card">
            <strong>Real customer install shape</strong>
            <p>
              In production, this script source would use your hosted domain and
              a customer-specific bot ID generated after subscription checkout.
            </p>
          </article>
        </section>
      </main>

      <Script src={scriptSrc} strategy="afterInteractive" />
    </>
  );
}
