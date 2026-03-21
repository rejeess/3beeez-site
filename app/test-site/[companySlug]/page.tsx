import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/db";
import Script from "next/script";

type TestSitePageProps = {
  params: Promise<{
    companySlug: string;
  }>;
};

export default async function TestSitePage({ params }: TestSitePageProps) {
  const { companySlug } = await params;
  const company = getCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  return (
    <main className="test-site-shell">
      <section className="test-site-hero">
        <div>
          <p className="eyebrow">Client test website</p>
          <h1>{company.name} website preview</h1>
          <p className="admin-intro">
            This page mocks a normal customer website before the 3Beeez script
            is installed. There is no chat icon here yet.
          </p>
        </div>
        <div className="test-site-code">
          <strong>No script installed yet</strong>
          <pre><code>{`<script
  src="https://cdn.3beeez.com/widget.js"
  data-bot-id="${company.botId}"
  data-theme="midnight"
  data-position="bottom-right">
</script>`}</code></pre>
        </div>
      </section>

      <section className="test-site-grid">
        <article className="test-site-card">
          <strong>Before payment</strong>
          <p>
            The company just has a normal website. No chatbot is visible until
            they buy the service and add the script you provide.
          </p>
          <ul className="test-site-list">
            <li>No floating chat icon</li>
            <li>No embedded widget yet</li>
            <li>Ready for 3Beeez script installation</li>
          </ul>
        </article>

        <article className="test-site-card">
          <strong>After payment</strong>
          <p>
            The company receives a client admin login, uploads its knowledge,
            and then places your widget script on this website.
          </p>
          <div className="purchase-actions">
            <Link className="button button-primary" href={`/purchase-demo/${company.slug}`}>
              View post-purchase mock
            </Link>
            <Link
              className="button button-secondary"
              href={`/test-site/${company.slug}/installed`}
            >
              View website with script
            </Link>
          </div>
        </article>
      </section>

      <section className="test-site-grid">
        <article className="test-site-card">
          <strong>Typical website content</strong>
          <p>
            This area represents the client&apos;s normal product or service
            website. Visitors browse pages as usual until the chat script is
            installed.
          </p>
        </article>

        <article className="test-site-card">
          <strong>Why this matters</strong>
          <p>
            The 3Beeez widget should feel like an add-on to an existing site,
            not part of the page source before the company has purchased the
            service.
          </p>
          <Link
            className="button button-secondary"
            href={`/test-site/${company.slug}/installed`}
          >
            Compare with installed version
          </Link>
        </article>
      </section>
      <Script
        src={`/widget-script?botId=${encodeURIComponent(company.botId)}&position=bottom-right&iconColor=%235ae0d2`}
        strategy="afterInteractive"
      />
    </main>
  );
}
