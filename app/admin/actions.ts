"use server";

import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { setCompanyStatus, type CompanyStatus } from "@/lib/db";

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
