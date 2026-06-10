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
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <a className="portal-sidebar-logo" href="/portal" aria-label="3Beeez portal home">
          <span className="brand-mark">3B</span>
          <span className="brand-text">3beeez</span>
        </a>

        <PortalNav />

        <div className="portal-sidebar-footer">
          <div className="portal-sidebar-company">
            <span className={`portal-sidebar-status-dot portal-sidebar-status-dot-${company.status}`} aria-hidden="true" />
            <span className="portal-sidebar-company-name" title={company.name}>{company.name}</span>
          </div>
          {user.role === "owner" && (
            <a className="portal-sidebar-admin-link" href="/admin">↗ Admin panel</a>
          )}
          <LogoutForm />
        </div>
      </aside>

      <main className="portal-main">
        {children}
      </main>
    </div>
  );
}
