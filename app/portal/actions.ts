"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/db";
import {
  ingestPdfFile,
  ingestWebsiteUrl,
  ingestWordFile,
} from "@/lib/knowledge-ingest";
import { storeKnowledgeSource } from "@/lib/knowledge-service";

async function resolveCompanyId(): Promise<number> {
  const user = await getCurrentUser();

  if (!user || (user.role !== "client_admin" && user.role !== "owner")) {
    redirect("/login");
  }

  const companyId =
    user.role === "owner"
      ? (getCompanyBySlug("3beeez")?.id ?? null)
      : user.companyId;

  if (!companyId) redirect("/login");

  return companyId as number;
}

export async function uploadWebsiteAction(formData: FormData) {
  const companyId = await resolveCompanyId();
  const url = String(formData.get("websiteUrl") || "").trim();

  if (!url) redirect("/portal");

  try {
    const website = await ingestWebsiteUrl(url);
    await storeKnowledgeSource({ companyId, kind: "website", title: website.title, content: website.content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Website import failed.";
    revalidatePath("/portal");
    redirect(`/portal?uploadError=${encodeURIComponent(message)}`);
  }

  revalidatePath("/portal");
  redirect("/portal?uploadSuccess=Website+content+imported+successfully");
}

export async function uploadPdfAction(formData: FormData) {
  const companyId = await resolveCompanyId();
  const file = formData.get("pdfFile");

  if (!(file instanceof File) || file.size === 0) redirect("/portal");

  try {
    const document = await ingestPdfFile(file as File);
    await storeKnowledgeSource({ companyId, kind: "pdf", title: document.title, content: document.content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF upload failed.";
    revalidatePath("/portal");
    redirect(`/portal?uploadError=${encodeURIComponent(message)}`);
  }

  revalidatePath("/portal");
  redirect("/portal?uploadSuccess=PDF+uploaded+successfully");
}

export async function uploadWordAction(formData: FormData) {
  const companyId = await resolveCompanyId();
  const file = formData.get("wordFile");

  if (!(file instanceof File) || file.size === 0) redirect("/portal");

  try {
    const document = await ingestWordFile(file as File);
    await storeKnowledgeSource({ companyId, kind: "word", title: document.title, content: document.content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Word upload failed.";
    revalidatePath("/portal");
    redirect(`/portal?uploadError=${encodeURIComponent(message)}`);
  }

  revalidatePath("/portal");
  redirect("/portal?uploadSuccess=Word+document+uploaded+successfully");
}

export async function saveNotesAction(formData: FormData) {
  const companyId = await resolveCompanyId();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();

  if (!title || !content) redirect("/portal");

  await storeKnowledgeSource({ companyId, kind: "history", title, content });
  revalidatePath("/portal");
  redirect("/portal?uploadSuccess=Notes+saved+successfully");
}
