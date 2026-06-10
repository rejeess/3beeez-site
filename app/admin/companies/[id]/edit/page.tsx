import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getCompanyById } from "@/lib/db";
import { updateCompanyDetails } from "@/app/admin/actions";

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOwner();
  const { id } = await params;
  const company = getCompanyById(Number(id));

  if (!company) notFound();

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Edit Client: {company.name}</h1>
          </div>
          <a className="button button-secondary" href="/admin">Back to Admin</a>
        </div>
      </section>

      <section style={{ maxWidth: "540px", padding: "32px 24px" }}>
        <form action={updateCompanyDetails} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <input type="hidden" name="companyId" value={company.id} />

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="company-name" style={{ fontSize: "13px", fontWeight: 600, opacity: 0.7 }}>Company Name</label>
            <input
              id="company-name"
              name="name"
              required
              defaultValue={company.name}
              style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--panel)", color: "inherit", fontSize: "15px" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="bot-id" style={{ fontSize: "13px", fontWeight: 600, opacity: 0.7 }}>Bot ID</label>
            <input
              id="bot-id"
              name="botId"
              required
              defaultValue={company.botId}
              style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--panel)", color: "inherit", fontSize: "15px" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="allowed-domain" style={{ fontSize: "13px", fontWeight: 600, opacity: 0.7 }}>Allowed Domain</label>
            <input
              id="allowed-domain"
              name="allowedDomain"
              defaultValue={company.allowedDomain}
              placeholder="e.g. example.com — leave empty for unrestricted"
              style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--panel)", color: "inherit", fontSize: "15px" }}
            />
            <p style={{ fontSize: "12px", opacity: 0.5, margin: 0 }}>
              Leave empty to allow all domains. Enter a domain (e.g. <code>abc-realtors.vercel.app</code>) to restrict.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
            <button type="submit" className="button button-primary">Save Changes</button>
            <a href="/admin" className="button button-secondary">Cancel</a>
          </div>
        </form>
      </section>
    </main>
  );
}
