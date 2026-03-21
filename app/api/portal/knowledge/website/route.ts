import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addKnowledgeEntry } from "@/lib/db";
import { ingestWebsiteUrl } from "@/lib/knowledge-ingest";

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
    const url = String(formData.get("websiteUrl") || "").trim();
    const companyId = user.companyId;

    if (!url || !companyId) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    const website = await ingestWebsiteUrl(url);

    addKnowledgeEntry({
      companyId,
      kind: "website",
      title: website.title,
      content: `Source URL: ${url}\n\n${website.content}`,
    });

    return NextResponse.redirect(new URL("/portal", request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Website import failed for local testing.";
    const url = new URL("/portal", request.url);
    url.searchParams.set("uploadError", message);
    return NextResponse.redirect(url);
  }
}
