"use server";

import { redirect } from "next/navigation";
import { requireClientPortalUser } from "@/lib/auth";
import { addKnowledgeEntry } from "@/lib/db";

async function requireClientCompanyId() {
  const user = await requireClientPortalUser();

  if (user.role === "owner") {
    redirect("/admin");
  }

  if (!user.companyId) {
    redirect("/login");
  }

  return user.companyId;
}

export async function addKnowledgeEntryAction(formData: FormData) {
  const kind = String(formData.get("kind") || "") as
    | "document"
    | "website"
    | "history";
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const companyId = await requireClientCompanyId();

  if (!title || !content) {
    return;
  }

  addKnowledgeEntry({
    companyId,
    kind,
    title,
    content,
  });
}

export async function addWebsiteKnowledgeAction(formData: FormData) {
  const companyId = await requireClientCompanyId();
  const url = String(formData.get("websiteUrl") || "").trim();

  if (!url) {
    return;
  }

  const { ingestWebsiteUrl } = await import("@/lib/knowledge-ingest");
  const website = await ingestWebsiteUrl(url);

  addKnowledgeEntry({
    companyId,
    kind: "website",
    title: website.title,
    content: `Source URL: ${url}\n\n${website.content}`,
  });
}

export async function addWordKnowledgeAction(formData: FormData) {
  const companyId = await requireClientCompanyId();
  const file = formData.get("wordFile");

  if (!(file instanceof File) || file.size === 0) {
    return;
  }

  const { ingestWordFile } = await import("@/lib/knowledge-ingest");
  const document = await ingestWordFile(file);

  addKnowledgeEntry({
    companyId,
    kind: "word",
    title: document.title,
    content: document.content,
  });
}
