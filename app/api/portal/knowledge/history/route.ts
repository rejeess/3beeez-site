import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addKnowledgeEntry } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "client_admin" && user.role !== "owner")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user.role !== "owner" && !user.companyId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const companyId = user.companyId;

  if (!title || !content || !companyId) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  addKnowledgeEntry({
    companyId,
    kind: "history",
    title,
    content,
  });

  return NextResponse.redirect(new URL("/portal", request.url));
}
