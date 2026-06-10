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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

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
  const recentConversations = conversations.slice(0, 5);

  const today = new Date().toLocaleDateString("en-US", { dateStyle: "long" });

  return (
    <>
      <UploadStatusBanner success={uploadSuccess} error={uploadError} />

      {/* Header */}
      <div className="portal-dash-header">
        <div>
          <h1 className="portal-dash-welcome">Welcome back, {company.name}!</h1>
          <p className="portal-dash-subtitle">Here's what's happening with your AI chat service today.</p>
        </div>
        <div className="portal-dash-date">{today}</div>
      </div>

      {/* Stat cards */}
      <div className="portal-stat-row">
        <article className="portal-stat-card">
          <div className="portal-stat-icon portal-stat-icon-teal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <p className="portal-stat-value">{totalConversations}</p>
            <p className="portal-stat-label">Total Chats</p>
          </div>
        </article>

        <article className="portal-stat-card">
          <div className="portal-stat-icon portal-stat-icon-amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <p className="portal-stat-value">{leadsCount}</p>
            <p className="portal-stat-label">Leads Captured</p>
          </div>
        </article>

        <article className="portal-stat-card">
          <div className="portal-stat-icon portal-stat-icon-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div>
            <p className="portal-stat-value">{knowledgeEntries.length}</p>
            <p className="portal-stat-label">Knowledge Sources</p>
          </div>
        </article>

        <article className="portal-stat-card">
          <div className="portal-stat-icon portal-stat-icon-green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <p className="portal-stat-value">{knowledgeModel?.chunkCount ?? 0}</p>
            <p className="portal-stat-label">
              Indexed Chunks
              {knowledgeModel?.trainedAt
                ? ` · ${new Date(knowledgeModel.trainedAt).toLocaleDateString("en-US", { dateStyle: "short" })}`
                : ""}
            </p>
          </div>
        </article>
      </div>

      {/* Recent Chat History */}
      <div className="portal-section">
        <div className="portal-section-header">
          <strong>Recent Chat History</strong>
          <Link href="/portal/conversations" className="portal-view-all-link">View all →</Link>
        </div>
        {recentConversations.length === 0 ? (
          <p className="portal-empty-table">No conversations yet. Once visitors start chatting, they'll appear here.</p>
        ) : (
          <table className="portal-table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Date</th>
                <th>Messages</th>
                <th>Lead</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentConversations.map((conv) => (
                <tr key={conv.id}>
                  <td>{conv.leadName || <span style={{ color: "var(--muted)", fontFamily: "monospace", fontSize: "0.78rem" }}>{conv.visitorId.slice(0, 14)}…</span>}</td>
                  <td style={{ color: "var(--muted)" }}>{formatDate(conv.createdAt)}</td>
                  <td>{conv.messageCount}</td>
                  <td>
                    {conv.leadEmail
                      ? <span className="portal-lead-badge">Lead</span>
                      : <span style={{ color: "var(--muted)" }}>—</span>}
                  </td>
                  <td>
                    <Link href={`/portal/conversations/${conv.publicId}`} className="portal-table-link">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Actions */}
      <h2 className="portal-section-label">Quick Actions</h2>
      <div className="portal-quick-actions">
        <Link href="/portal/knowledge" className="portal-quick-action">
          <div className="portal-quick-action-icon portal-stat-icon-teal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <strong>Add Knowledge</strong>
          <p>Upload docs, URLs, or notes</p>
        </Link>

        <Link href="/portal/conversations" className="portal-quick-action">
          <div className="portal-quick-action-icon portal-stat-icon-blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <strong>View Chat History</strong>
          <p>Browse all conversations</p>
        </Link>

        <article className="portal-quick-action">
          <div className={`portal-quick-action-icon ${company.status === "active" ? "portal-stat-icon-green" : "portal-stat-icon-amber"}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <strong>Chat Service</strong>
          <p>
            <span className={`portal-chat-live-badge portal-chat-live-badge-${company.status}`}>
              {company.status === "active" ? "● Live" : "⏸ Paused"}
            </span>
          </p>
          <form action={toggleChatStatusAction}>
            <SubmitButton
              label={company.status === "active" ? "Pause widget" : "Resume widget"}
              pendingLabel={company.status === "active" ? "Pausing…" : "Resuming…"}
              className="portal-quick-action-toggle"
            />
          </form>
        </article>

        <article className="portal-quick-action">
          <div className="portal-quick-action-icon portal-stat-icon-amber">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <strong>Install Script</strong>
          <p>Add to your website's <code>&lt;/body&gt;</code></p>
          <code className="portal-install-token">{`?installToken=${company.installToken.slice(0, 12)}…`}</code>
        </article>
      </div>
    </>
  );
}
