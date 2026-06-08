import { requireClientPortalUser } from "@/lib/auth";
import { getConversationWithMessages, listCompanies } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const user = await requireClientPortalUser();
  const { publicId } = await params;

  const companyId =
    user.role === "owner"
      ? listCompanies().find((c) => c.slug === "3beeez")?.id ?? null
      : user.companyId;

  if (!companyId) redirect("/portal");

  const conversation = getConversationWithMessages(publicId);
  if (!conversation || conversation.companyId !== companyId) notFound();

  return (
    <section className="admin-list">
      <div className="conversation-detail-back">
        <Link href="/portal/conversations" className="portal-back-link">
          ← Back to Chat History
        </Link>
      </div>

      <article className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2>{conversation.leadName || "Anonymous visitor"}</h2>
            <div className="admin-lead-grid">
              <div className="admin-lead-field">
                <span className="admin-label">Email</span>
                <span>{conversation.leadEmail || "—"}</span>
              </div>
              <div className="admin-lead-field">
                <span className="admin-label">Phone</span>
                <span>{conversation.leadPhone || "—"}</span>
              </div>
            </div>
          </div>
          <div className="admin-meta">
            <span>{formatDate(conversation.updatedAt)}</span>
            <span>{conversation.messages.length} messages</span>
          </div>
        </div>

        <div className="admin-detail-grid">
          <div className="admin-detail-card">
            <span className="admin-label">Conversation ID</span>
            <code>{conversation.publicId}</code>
          </div>
          <div className="admin-detail-card">
            <span className="admin-label">Visitor ID</span>
            <code>{conversation.visitorId}</code>
          </div>
          <div className="admin-detail-card admin-detail-card-wide">
            <span className="admin-label">Source URL</span>
            <code>{conversation.sourceUrl || "Unknown"}</code>
          </div>
        </div>

        <div className="admin-message-list">
          {conversation.messages.map((message) => (
            <div className={`admin-message admin-message-${message.role}`} key={message.id}>
              <div className="admin-message-meta">
                <strong>{message.role === "user" ? "Visitor" : "Bot"}</strong>
                <span>{formatDate(message.createdAt)}</span>
              </div>
              <p>{message.content}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
