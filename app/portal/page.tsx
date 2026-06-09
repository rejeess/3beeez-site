import { redirect } from "next/navigation";
import Link from "next/link";
import { requireClientPortalUser } from "@/lib/auth";
import {
  countConversationsByCompany,
  getKnowledgeModelByCompany,
  listCompanies,
  listConversationsByCompany,
  listKnowledgeEntriesByCompany,
} from "@/lib/db";
import { UploadStatusBanner } from "@/components/upload-status-banner";
import { SubmitButton } from "@/components/submit-button";
import { toggleChatStatusAction } from "@/app/portal/actions";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ uploadSuccess?: string; uploadError?: string }>;
}) {
  const user = await requireClientPortalUser();
  const { uploadSuccess, uploadError } = await searchParams;

  const companyId =
    user.role === "owner"
      ? listCompanies().find((c) => c.slug === "3beeez")?.id ?? null
      : user.companyId;

  if (!companyId) redirect("/login");

  const company = listCompanies().find((c) => c.id === companyId);
  if (!company) redirect("/login");

  const totalConversations = countConversationsByCompany(companyId);
  const conversations = listConversationsByCompany(companyId);
  const knowledgeEntries = listKnowledgeEntriesByCompany(companyId);
  const knowledgeModel = getKnowledgeModelByCompany(companyId);
  const leadsCount = conversations.filter((c) => c.leadEmail || c.leadName).length;

  return (
    <>
      <UploadStatusBanner success={uploadSuccess} error={uploadError} />

      <section className="admin-summary-grid">
        <article className="admin-summary-card">
          <strong>{totalConversations}</strong>
          <span>Total conversations</span>
        </article>
        <article className="admin-summary-card">
          <strong>{leadsCount}</strong>
          <span>Conversations with lead details</span>
        </article>
        <article className="admin-summary-card">
          <strong>{knowledgeEntries.length}</strong>
          <span>Knowledge sources</span>
        </article>
        <article className="admin-summary-card">
          <strong>{knowledgeModel?.chunkCount || 0}</strong>
          <span>
            Indexed chunks
            {knowledgeModel?.trainedAt
              ? ` · trained ${new Date(knowledgeModel.trainedAt).toLocaleDateString()}`
              : ""}
          </span>
        </article>
      </section>

      <section className="portal-workspace-grid">
        <article className="portal-card portal-card-wide">
          <strong>Your install script</strong>
          <p>
            Paste this script just before the closing <code>&lt;/body&gt;</code> tag on every page of your website.
          </p>
          <pre className="install-snippet">
            <code>{`<script\n  src="/widget-script?installToken=${company.installToken}"\n  data-position="bottom-right">\n</script>`}</code>
          </pre>
        </article>

        <article className="portal-card portal-chat-status-card">
          <div className="portal-chat-status-header">
            <div>
              <strong>Chat Service</strong>
              <p>Control whether visitors on your website can see and use the chat widget.</p>
            </div>
            <span className={`portal-status-badge portal-status-badge-${company.status}`}>
              {company.status === "active" ? "● Live" : company.status === "paused" ? "⏸ Paused" : company.status}
            </span>
          </div>
          {company.status === "paused" && (
            <p className="portal-status-warning">
              Your chat widget is currently hidden from visitors. Resume it when you're ready.
            </p>
          )}
          <form action={toggleChatStatusAction}>
            <SubmitButton
              label={company.status === "active" ? "Pause chat" : "Resume chat"}
              pendingLabel={company.status === "active" ? "Pausing…" : "Resuming…"}
              className={company.status === "active" ? "portal-pause-btn" : "portal-resume-btn"}
            />
          </form>
        </article>

        <Link href="/portal/knowledge" className="portal-nav-card">
          <strong>Knowledge Base</strong>
          <p>
            {knowledgeEntries.length} source{knowledgeEntries.length !== 1 ? "s" : ""} uploaded —
            add website URLs, PDFs, Word docs, or notes.
          </p>
          <span className="portal-nav-card-cta">Manage knowledge →</span>
        </Link>

        <Link href="/portal/conversations" className="portal-nav-card">
          <strong>Chat History</strong>
          <p>
            {totalConversations} conversation{totalConversations !== 1 ? "s" : ""} captured —
            view leads and message history.
          </p>
          <span className="portal-nav-card-cta">View chats →</span>
        </Link>
      </section>
    </>
  );
}
