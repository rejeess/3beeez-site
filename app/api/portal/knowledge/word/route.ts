import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/db";
import { ingestWordFile } from "@/lib/knowledge-ingest";
import { storeKnowledgeSource } from "@/lib/knowledge-service";

export async function POST(request: Request) {
  try {
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
    const file = formData.get("wordFile");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    const document = await ingestWordFile(file);

    await storeKnowledgeSource({
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
