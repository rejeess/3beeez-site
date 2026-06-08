import type { ConversationWithMessages } from "@/lib/db";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type AdminConversationListProps = {
  conversations: ConversationWithMessages[];
  emptyTitle: string;
  emptyText: string;
  showCompany?: boolean;
};

export function AdminConversationList({
  conversations,
  emptyTitle,
  emptyText,
  showCompany = false,
}: AdminConversationListProps) {
  return (
    <section className="admin-list">
      {conversations.length === 0 ? (
        <article className="admin-empty-state">
          <strong>{emptyTitle}</strong>
          <p>{emptyText}</p>
        </article>
      ) : (
        conversations.map((conversation) => (
          <article className="admin-card" key={conversation.id}>
            <div className="admin-card-header">
              <div>
                <h2>{conversation.leadName || "Anonymous visitor"}</h2>
                {showCompany ? (
                  <p className="admin-company-line">Account: {conversation.companyName}</p>
                ) : null}
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
                <div
                  className={`admin-message admin-message-${message.role}`}
                  key={message.id}
                >
                  <div className="admin-message-meta">
                    <strong>{message.role === "user" ? "Visitor" : "Bot"}</strong>
                    <span>{formatDate(message.createdAt)}</span>
                  </div>
                  <p>{message.content}</p>
                </div>
              ))}
            </div>
          </article>
        ))
      )}
    </section>
  );
}
