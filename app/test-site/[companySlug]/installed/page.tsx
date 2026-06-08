import Link from "next/link";
import { notFound } from "next/navigation";
import { ScriptInstallPlayground } from "@/components/script-install-playground";
import { getCompanyBySlug } from "@/lib/db";

type InstalledTestSitePageProps = {
  params: Promise<{
    companySlug: string;
  }>;
};

export default async function InstalledTestSitePage({
  params,
}: InstalledTestSitePageProps) {
  if (process.env.NODE_ENV !== "development") notFound();

  const { companySlug } = await params;
  const company = getCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  const localSnippet = `<script
  src="/widget-script?botId=${company.botId}&position=bottom-right&iconColor=%235ae0d2">
</script>`;

  return (
    <main className="test-site-shell">
      <section className="test-site-hero">
        <div>
          <p className="eyebrow">Client test website</p>
          <h1>{company.name} install playground</h1>
          <p className="admin-intro">
            This page starts without any chat widget. Paste the generated script
            from the purchase success page and install it manually to test the
            real post-payment script.
          </p>
        </div>
        <div className="test-site-code">
          <strong>Example local test snippet</strong>
          <pre><code>{localSnippet}</code></pre>
        </div>
      </section>

      <section className="test-site-grid">
        <article className="test-site-card">
          <strong>Before installing the script</strong>
          <ul className="test-site-list">
            <li>No chat icon should be visible on this page</li>
            <li>The site behaves like a normal customer website</li>
            <li>You decide when to install the generated script</li>
          </ul>
        </article>

        <article className="test-site-card">
          <strong>Compare states</strong>
          <div className="purchase-actions">
            <Link className="button button-secondary" href={`/test-site/${company.slug}`}>
              View normal website
            </Link>
            <Link
              className="button button-secondary"
              href={`/test-site/${company.slug}/script-tag`}
            >
              View script tag test
            </Link>
            <Link className="button button-primary" href="/portal">
              Open client portal
            </Link>
          </div>
        </article>
      </section>

      <ScriptInstallPlayground
        companyName={company.name}
        defaultSnippet={localSnippet}
      />
    </main>
  );
}
