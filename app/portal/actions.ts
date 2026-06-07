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
  let url = String(formData.get("websiteUrl") || "").trim();

  if (!url) redirect("/portal");

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

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

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

async function validateFileUpload(
  file: unknown,
  allowedMimeTypes: string[],
  pdfMagic = false,
): Promise<File> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file provided.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File exceeds the 25 MB limit.");
  }
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(`File type not allowed (got "${file.type}").`);
  }
  if (pdfMagic) {
    const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    // %PDF magic bytes
    if (!(header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46)) {
      throw new Error("File does not appear to be a valid PDF.");
    }
  }
  return file;
}

export async function uploadPdfAction(formData: FormData) {
  const companyId = await resolveCompanyId();

  try {
    const file = await validateFileUpload(
      formData.get("pdfFile"),
      ["application/pdf"],
      true,
    );
    const document = await ingestPdfFile(file);
    await storeKnowledgeSource({ companyId, kind: "pdf", title: document.title, content: document.content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF upload failed.";
    revalidatePath("/portal");
    redirect(`/portal?uploadError=${encodeURIComponent(message)}`);
  }

  revalidatePath("/portal");
  redirect("/portal?uploadSuccess=PDF+uploaded+successfully");
}

const WORD_MIME_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function uploadWordAction(formData: FormData) {
  const companyId = await resolveCompanyId();

  try {
    const file = await validateFileUpload(formData.get("wordFile"), WORD_MIME_TYPES);
    const document = await ingestWordFile(file);
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
