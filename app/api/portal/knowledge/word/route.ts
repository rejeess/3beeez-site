import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addKnowledgeEntry } from "@/lib/db";
import { ingestWordFile } from "@/lib/knowledge-ingest";

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
    const file = formData.get("wordFile");
    const companyId = user.companyId;

    if (!(file instanceof File) || file.size === 0 || !companyId) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    const document = await ingestWordFile(file);

    addKnowledgeEntry({
      companyId,
      kind: "word",
      title: document.title,
      content: document.content,
    });

    return NextResponse.redirect(new URL("/portal", request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Word upload failed for local testing.";
    const url = new URL("/portal", request.url);
    url.searchParams.set("uploadError", message);
    return NextResponse.redirect(url);
  }
}
