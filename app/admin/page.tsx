import { AdminConversationList } from "@/components/admin-conversation-list";
import { LogoutForm } from "@/components/logout-form";
import { requireOwner } from "@/lib/auth";
import { listCompanies, listConversations } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireOwner();
  const conversations = listConversations();
  const companies = listCompanies();

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">Admin inbox</p>
            <h1>Customer chat conversations</h1>
          </div>
          <LogoutForm />
        </div>
        <p className="admin-intro">
          Every chat sent through the website is stored here with optional lead
          details, timestamps, and full message history.
        </p>
      </section>

      <section className="admin-summary-grid">
        <article className="admin-summary-card">
          <strong>{conversations.length}</strong>
          <span>Total conversations</span>
        </article>
        <article className="admin-summary-card">
          <strong>
            {
              conversations.filter(
                (conversation) =>
                  conversation.leadEmail || conversation.leadName
              ).length
            }
          </strong>
          <span>Conversations with lead details</span>
        </article>
        <article className="admin-summary-card">
          <strong>{companies.length}</strong>
          <span>Client accounts with chat portals</span>
        </article>
      </section>
      <section className="portal-directory">
        {companies.map((company) => (
          <article className="portal-card" key={company.slug}>
            <strong>{company.name}</strong>
            <p>
              Portal: <code>/portal</code>
            </p>
            <p>
              Chat bot ID: <code>{company.botId}</code>
            </p>
            <p>
              Test site: <code>{`/test-site/${company.slug}`}</code>
            </p>
          </article>
        ))}
      </section>

      <AdminConversationList
        conversations={conversations}
        emptyTitle="No chats yet"
        emptyText="Once visitors start chatting from the website widget, their conversation history will appear here."
        showCompany
      />
    </main>
  );
}
