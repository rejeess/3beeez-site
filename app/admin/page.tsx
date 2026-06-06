import { AdminConversationList } from "@/components/admin-conversation-list";
import { LogoutForm } from "@/components/logout-form";
import { requireOwner } from "@/lib/auth";
import { listCompanies, listConversations } from "@/lib/db";
import { updateCompanyStatus } from "./actions";

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
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <a className="button button-primary" href="/portal">Manage 3Beeez Knowledge</a>
            <LogoutForm />
          </div>
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <strong>{company.name}</strong>
              <span className={`status-badge status-badge-${company.status}`}>
                {company.status}
              </span>
            </div>
            <p>
              Bot ID: <code>{company.botId}</code>
            </p>
            <p>
              Allowed domain: <code>{company.allowedDomain || "unrestricted"}</code>
            </p>
            <p>
              Test site: <code>{`/test-site/${company.slug}`}</code>
            </p>
            <div className="purchase-actions" style={{ marginTop: "12px" }}>
              {company.status === "active" ? (
                <form action={updateCompanyStatus}>
                  <input type="hidden" name="companyId" value={company.id} />
                  <input type="hidden" name="status" value="suspended" />
                  <button className="button button-secondary" type="submit">
                    Suspend
                  </button>
                </form>
              ) : (
                <form action={updateCompanyStatus}>
                  <input type="hidden" name="companyId" value={company.id} />
                  <input type="hidden" name="status" value="active" />
                  <button className="button button-primary" type="submit">
                    Activate
                  </button>
                </form>
              )}
            </div>
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
