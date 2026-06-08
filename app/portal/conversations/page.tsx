import Link from "next/link";
import { requireClientPortalUser } from "@/lib/auth";
import {
  countConversationsByCompany,
  listCompanies,
  listConversationsByCompanyPaginated,
} from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const PER_PAGE = 10;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireClientPortalUser();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const companyId =
    user.role === "owner"
      ? listCompanies().find((c) => c.slug === "3beeez")?.id ?? null
      : user.companyId;

  if (!companyId) redirect("/portal");

  const total = countConversationsByCompany(companyId);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const conversations = listConversationsByCompanyPaginated(companyId, currentPage, PER_PAGE);

  return (
    <section className="admin-list">
      {conversations.length === 0 ? (
        <article className="admin-empty-state">
          <strong>No chats yet</strong>
          <p>Once visitors start chatting from your website widget, conversations will appear here.</p>
        </article>
      ) : (
        <>
          {conversations.map((c) => (
            <Link href={`/portal/conversations/${c.publicId}`} key={c.id} className="conversation-row">
              <div className="conversation-row-lead">
                <strong className="conversation-row-name">{c.leadName || "Anonymous visitor"}</strong>
                <div className="conversation-row-contact">
                  {c.leadEmail && (
                    <span>
                      <span className="admin-label">Email</span>
                      {c.leadEmail}
                    </span>
                  )}
                  {c.leadPhone && (
                    <span>
                      <span className="admin-label">Phone</span>
                      {c.leadPhone}
                    </span>
                  )}
                </div>
              </div>
              <div className="conversation-row-meta">
                <span>{formatDate(c.updatedAt)}</span>
                <span className="conversation-row-count">
                  {c.messageCount} message{c.messageCount !== 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}

          {totalPages > 1 && (
            <nav className="portal-pagination">
              {currentPage > 1 ? (
                <Link href={`/portal/conversations?page=${currentPage - 1}`} className="portal-page-btn">
                  ← Previous
                </Link>
              ) : (
                <span className="portal-page-btn portal-page-btn-disabled">← Previous</span>
              )}
              <span className="portal-page-info">Page {currentPage} of {totalPages}</span>
              {currentPage < totalPages ? (
                <Link href={`/portal/conversations?page=${currentPage + 1}`} className="portal-page-btn">
                  Next →
                </Link>
              ) : (
                <span className="portal-page-btn portal-page-btn-disabled">Next →</span>
              )}
            </nav>
          )}
        </>
      )}
    </section>
  );
}
