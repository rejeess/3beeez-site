import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/db";
import { ingestWebsiteUrl } from "@/lib/knowledge-ingest";
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
    const url = String(formData.get("websiteUrl") || "").trim();

    if (!url) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    const website = await ingestWebsiteUrl(url);

    await storeKnowledgeSource({
      companyId,
      kind: "website",
      title: website.title,
      content: website.content,
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
