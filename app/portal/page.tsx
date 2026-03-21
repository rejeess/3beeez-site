import { redirect } from "next/navigation";
import { AdminConversationList } from "@/components/admin-conversation-list";
import { LogoutForm } from "@/components/logout-form";
import { requireClientPortalUser } from "@/lib/auth";
import {
  listCompanies,
  listConversationsByCompany,
  listKnowledgeEntriesByCompany,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ uploadError?: string }>;
}) {
  const user = await requireClientPortalUser();
  const { uploadError } = await searchParams;

  if (user.role === "owner") {
    redirect("/admin");
  }

  if (!user.companyId) {
    redirect("/login");
  }

  const company = listCompanies().find((entry) => entry.id === user.companyId);

  if (!company) {
    redirect("/login");
  }

  const conversations = listConversationsByCompany(company.id);
  const knowledgeEntries = listKnowledgeEntriesByCompany(company.id);

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">Client portal</p>
            <h1>{company.name} chat inbox</h1>
          </div>
          <LogoutForm />
        </div>
        <p className="admin-intro">
          This portal shows only the conversations captured by your company&apos;s
          chatbot.
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
      </section>

      <section className="portal-workspace-grid">
        {uploadError ? (
          <article className="portal-card portal-card-wide">
            <strong>Upload issue</strong>
            <p>{uploadError}</p>
          </article>
        ) : null}

        <article className="portal-card">
          <strong>Website URL ingest</strong>
          <p>
            Paste a real website URL so the bot can use public company content
            for local testing.
          </p>
          <form action="/api/portal/knowledge/website" className="knowledge-form" method="post">
            <label className="login-label">
              <span>Website URL</span>
              <input
                name="websiteUrl"
                type="url"
                placeholder="https://www.company.com"
                required
              />
            </label>
            <button className="button button-primary login-button" type="submit">
              Import website content
            </button>
          </form>
        </article>

        <article className="portal-card">
          <strong>PDF upload</strong>
          <p>
            Upload a PDF document like a brochure, pricing guide, policy, or
            help manual.
          </p>
          <form
            action="/api/portal/knowledge/pdf"
            className="knowledge-form"
            encType="multipart/form-data"
            method="post"
          >
            <label className="login-label">
              <span>PDF document</span>
              <input
                accept=".pdf,application/pdf"
                name="pdfFile"
                required
                type="file"
              />
            </label>
            <button className="button button-primary login-button" type="submit">
              Upload PDF
            </button>
          </form>
        </article>

        <article className="portal-card">
          <strong>Word document upload</strong>
          <p>
            Upload a DOCX or DOC file with support notes, onboarding steps, or
            internal product details.
          </p>
          <form
            action="/api/portal/knowledge/word"
            className="knowledge-form"
            encType="multipart/form-data"
            method="post"
          >
            <label className="login-label">
              <span>Word document</span>
              <input
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                name="wordFile"
                required
                type="file"
              />
            </label>
            <button className="button button-primary login-button" type="submit">
              Upload Word document
            </button>
          </form>
        </article>

        <article className="portal-card">
          <strong>Previous chat/support history</strong>
          <p>
            Paste previous customer support notes or conversation summaries so
            the bot can answer with more context.
          </p>
          <form action="/api/portal/knowledge/history" className="knowledge-form" method="post">
            <input name="kind" type="hidden" value="history" />
            <label className="login-label">
              <span>Title</span>
              <input
                name="title"
                type="text"
                placeholder="Past support highlights"
                required
              />
            </label>
            <label className="login-label">
              <span>History notes</span>
              <textarea
                name="content"
                placeholder="Paste previous chat history or support notes"
                rows={6}
                required
              />
            </label>
            <button className="button button-primary login-button" type="submit">
              Save history notes
            </button>
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
