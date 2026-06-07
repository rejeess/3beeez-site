import { redirect } from "next/navigation";
import { AdminConversationList } from "@/components/admin-conversation-list";
import { LogoutForm } from "@/components/logout-form";
import { requireClientPortalUser } from "@/lib/auth";
import {
  getKnowledgeModelByCompany,
  listCompanies,
  listConversationsByCompany,
  listKnowledgeEntriesByCompany,
} from "@/lib/db";
import { UploadStatusBanner } from "@/components/upload-status-banner";
import { SubmitButton } from "@/components/submit-button";
import {
  saveNotesAction,
  uploadPdfAction,
  uploadWebsiteAction,
  uploadWordAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ uploadError?: string; uploadSuccess?: string }>;
}) {
  const user = await requireClientPortalUser();
  const { uploadError, uploadSuccess } = await searchParams;

  const companyId =
    user.role === "owner"
      ? listCompanies().find((c) => c.slug === "3beeez")?.id ?? null
      : user.companyId;

  if (!companyId) {
    redirect("/login");
  }

  const company = listCompanies().find((entry) => entry.id === companyId);

  if (!company) {
    redirect("/login");
  }

  const conversations = listConversationsByCompany(companyId);
  const knowledgeEntries = listKnowledgeEntriesByCompany(companyId);
  const knowledgeModel = getKnowledgeModelByCompany(companyId);

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">
              {user.role === "owner" ? "3Beeez knowledge portal" : "Client portal"}
            </p>
            <h1>{company.name} chat inbox</h1>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {user.role === "owner" ? (
              <a className="button button-secondary" href="/admin">Back to admin</a>
            ) : null}
            <LogoutForm />
          </div>
        </div>
        <p className="admin-intro">
          {user.role === "owner"
            ? "Upload knowledge so visitors to the 3Beeez website can get accurate answers from the chatbot."
            : "This portal shows only the conversations captured by your company's chatbot."}
        </p>
      </section>

      <section className="admin-summary-grid">
        <article className="admin-summary-card">
          <strong>{conversations.length}</strong>
          <span>Total conversations for {company.name}</span>
        </article>
        <article className="admin-summary-card">
          <strong>
            {
              conversations.filter(
                (conversation) => conversation.leadEmail || conversation.leadName
              ).length
            }
          </strong>
          <span>Conversations with lead details</span>
        </article>
        <article className="admin-summary-card">
          <strong>{knowledgeEntries.length}</strong>
          <span>Knowledge sources stored for the bot</span>
        </article>
        <article className="admin-summary-card">
          <strong>{knowledgeModel?.chunkCount || 0}</strong>
          <span>
            Indexed knowledge chunks
            {knowledgeModel?.trainedAt
              ? ` • trained ${new Date(knowledgeModel.trainedAt).toLocaleString()}`
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
          <pre className="install-snippet"><code>{`<script\n  src="/widget-script?installToken=${company.installToken}"\n  data-position="bottom-right">\n</script>`}</code></pre>
        </article>

        <UploadStatusBanner success={uploadSuccess} error={uploadError} />

        <article className="portal-card">
          <strong>Website URL ingest</strong>
          <p>
            Paste a real website URL so the bot can use public company content
            for local testing.
          </p>
          <form action={uploadWebsiteAction} className="knowledge-form">
            <label className="login-label">
              <span>Website URL</span>
              <input
                name="websiteUrl"
                type="text"
                placeholder="https://www.company.com"
                required
              />
            </label>
            <SubmitButton label="Import website content" pendingLabel="Importing…" />
          </form>
        </article>

        <article className="portal-card">
          <strong>PDF upload</strong>
          <p>
            Upload a PDF document like a brochure, pricing guide, policy, or
            help manual.
          </p>
          <form action={uploadPdfAction} className="knowledge-form">
            <label className="login-label">
              <span>PDF document</span>
              <input
                accept=".pdf,application/pdf"
                name="pdfFile"
                required
                type="file"
              />
            </label>
            <SubmitButton label="Upload PDF" pendingLabel="Uploading…" />
          </form>
        </article>

        <article className="portal-card">
          <strong>Word document upload</strong>
          <p>
            Upload a DOCX or DOC file with support notes, onboarding steps, or
            internal product details.
          </p>
          <form action={uploadWordAction} className="knowledge-form">
            <label className="login-label">
              <span>Word document</span>
              <input
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                name="wordFile"
                required
                type="file"
              />
            </label>
            <SubmitButton label="Upload Word document" pendingLabel="Uploading…" />
          </form>
        </article>

        <article className="portal-card">
          <strong>Plain text notes</strong>
          <p>
            Paste any product details, FAQs, pricing, support notes, or anything
            else the bot should know. Use a clear title so it is easy to manage.
          </p>
          <form action={saveNotesAction} className="knowledge-form">
            <label className="login-label">
              <span>Title</span>
              <input
                name="title"
                type="text"
                placeholder="e.g. Pricing FAQ, Onboarding steps, About us"
                required
              />
            </label>
            <label className="login-label">
              <span>Notes</span>
              <textarea
                name="content"
                placeholder="Paste or type any content you want the bot to use when answering visitor questions"
                rows={6}
                required
              />
            </label>
            <SubmitButton label="Save notes" pendingLabel="Saving…" />
          </form>
        </article>

        <article className="portal-card portal-card-wide">
          <strong>Stored knowledge sources</strong>
          <p>
            These imported materials are what the bot now uses to answer
            company-specific questions on the test website.
          </p>
          <div className="knowledge-list">
            {knowledgeEntries.map((entry) => (
              <div className="knowledge-item" key={entry.id}>
                <span className="knowledge-kind">{entry.kind}</span>
                <strong>{entry.title}</strong>
                <p>{entry.content}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="portal-help-card">
        <strong>Suggested local testing flow</strong>
        <ol className="install-steps">
          <li>Import a real company website URL.</li>
          <li>Upload a PDF with product, pricing, or policy information.</li>
          <li>Upload a Word document with support notes or onboarding details.</li>
          <li>Open the installed test website and ask company-specific questions.</li>
        </ol>
      </section>

      <AdminConversationList
        conversations={conversations}
        emptyTitle={`No chats yet for ${company.name}`}
        emptyText="Once visitors start chatting from your website widget, the conversation history will appear here."
      />
    </main>
  );
}
