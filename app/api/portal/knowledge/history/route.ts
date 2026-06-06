import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/db";
import { storeKnowledgeSource } from "@/lib/knowledge-service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "client_admin" && user.role !== "owner")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const companyId =
    user.role === "owner"
      ? (getCompanyBySlug("3beeez")?.id ?? null)
      : user.companyId;

  if (!companyId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();

  if (!title || !content) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  await storeKnowledgeSource({
    companyId,
    kind: "history",
    title,
    content,
  });

  return NextResponse.redirect(new URL("/portal", request.url));
}
