import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addKnowledgeEntry } from "@/lib/db";
import { ingestPdfFile } from "@/lib/knowledge-ingest";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || (user.role !== "client_admin" && user.role !== "owner")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (user.role !== "owner" && !user.companyId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const formData = await request.formData();
    const file = formData.get("pdfFile");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    const document = await ingestPdfFile(file);
    const companyId = user.companyId;

    if (!companyId) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    addKnowledgeEntry({
      companyId,
      kind: "pdf",
      title: document.title,
      content: document.content,
    });

    return NextResponse.redirect(new URL("/portal", request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PDF upload failed for local testing.";
    const url = new URL("/portal", request.url);
    url.searchParams.set("uploadError", message);
    return NextResponse.redirect(url);
  }
}
