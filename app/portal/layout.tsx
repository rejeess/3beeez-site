import "server-only";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LogoutForm } from "@/components/logout-form";
import { PortalNav } from "@/components/portal-nav";
import { requireClientPortalUser } from "@/lib/auth";
import { listCompanies } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await requireClientPortalUser();

  const companyId =
    user.role === "owner"
      ? listCompanies().find((c) => c.slug === "3beeez")?.id ?? null
      : user.companyId;

  if (!companyId) redirect("/login");

  const company = listCompanies().find((c) => c.id === companyId);
  if (!company) redirect("/login");

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">
              {user.role === "owner" ? "3Beeez knowledge portal" : "Client portal"}
            </p>
            <h1>{company.name}</h1>
          </div>
          <div className="portal-topbar-actions">
            {user.role === "owner" && (
              <a className="button button-secondary" href="/admin">Back to admin</a>
            )}
            <LogoutForm />
          </div>
        </div>
        <PortalNav />
      </section>
      {children}
    </main>
  );
}
