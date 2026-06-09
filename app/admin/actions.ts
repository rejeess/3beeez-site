"use server";

import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { setCompanyStatus, updateCompany, type CompanyStatus } from "@/lib/db";

export async function updateCompanyStatus(formData: FormData) {
  await requireOwner();
  const companyId = Number(formData.get("companyId"));
  const status = String(formData.get("status")) as CompanyStatus;

  if (!companyId || !["active", "suspended", "expired"].includes(status)) {
    redirect("/admin");
  }

  setCompanyStatus(companyId, status);
  redirect("/admin");
}

export async function updateCompanyDetails(formData: FormData) {
  await requireOwner();
  const companyId = Number(formData.get("companyId"));
  const name = String(formData.get("name") ?? "").trim();
  const botId = String(formData.get("botId") ?? "").trim();
  const allowedDomain = String(formData.get("allowedDomain") ?? "").trim();

  if (!companyId || !name || !botId) {
    redirect("/admin");
  }

  updateCompany(companyId, { name, botId, allowedDomain });
  redirect("/admin");
}
