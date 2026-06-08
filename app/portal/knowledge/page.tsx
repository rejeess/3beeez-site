import { requireClientPortalUser } from "@/lib/auth";
import { listCompanies, listKnowledgeEntriesByCompany } from "@/lib/db";
import { redirect } from "next/navigation";
import { UploadStatusBanner } from "@/components/upload-status-banner";
import { KnowledgeList } from "@/components/knowledge-list";
import { SubmitButton } from "@/components/submit-button";
import {
  deleteKnowledgeAction,
  saveNotesAction,
  uploadPdfAction,
  uploadWebsiteAction,
  uploadWordAction,
} from "@/app/portal/actions";
import { UploadProgress } from "@/components/upload-progress";

export const dynamic = "force-dynamic";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ uploadError?: string; uploadSuccess?: string }>;
}) {
  const user = await requireClientPortalUser();
  const { uploadError, uploadSuccess } = await searchParams;

  const companyId =
    user.role === "owner"
      ? listCompanies().find((c) => c.slug === "3beeez")?.id ?? null
      : user.companyId;

  if (!companyId) redirect("/portal");

  const knowledgeEntries = listKnowledgeEntriesByCompany(companyId).map((e) => ({ ...e }));

  return (
    <section className="portal-workspace-grid">
      <UploadStatusBanner success={uploadSuccess} error={uploadError} />

      <article className="portal-card">
        <strong>Website URL ingest</strong>
        <p>Paste a real website URL so the bot can use public company content.</p>
        <form action={uploadWebsiteAction} className="knowledge-form">
          <label className="login-label">
            <span>Website URL</span>
            <input name="websiteUrl" type="text" placeholder="https://www.company.com" required />
          </label>
          <SubmitButton label="Import website content" pendingLabel="Importing…" />
          <UploadProgress type="website" />
        </form>
      </article>

      <article className="portal-card">
        <strong>PDF upload</strong>
        <p>Upload a PDF document like a brochure, pricing guide, or help manual.</p>
        <form action={uploadPdfAction} className="knowledge-form">
          <label className="login-label">
            <span>PDF document</span>
            <input accept=".pdf,application/pdf" name="pdfFile" required type="file" />
          </label>
          <SubmitButton label="Upload PDF" pendingLabel="Uploading…" />
          <UploadProgress type="pdf" />
        </form>
      </article>

      <article className="portal-card">
        <strong>Word document upload</strong>
        <p>Upload a DOCX or DOC file with support notes or product details.</p>
        <form action={uploadWordAction} className="knowledge-form">
          <label className="login-label">
            <span>Word document</span>
            <input
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              name="wordFile"
              required
              type="file"
            />
          </label>
          <SubmitButton label="Upload Word document" pendingLabel="Uploading…" />
          <UploadProgress type="word" />
        </form>
      </article>

      <article className="portal-card">
        <strong>Plain text notes</strong>
        <p>Paste FAQs, pricing, support notes, or anything the bot should know.</p>
        <form action={saveNotesAction} className="knowledge-form">
          <label className="login-label">
            <span>Title</span>
            <input name="title" type="text" placeholder="e.g. Pricing FAQ, About us" required />
          </label>
          <label className="login-label">
            <span>Notes</span>
            <textarea name="content" placeholder="Paste or type content…" rows={6} required />
          </label>
          <SubmitButton label="Save notes" pendingLabel="Saving…" />
          <UploadProgress type="notes" />
        </form>
      </article>

      <article className="portal-card portal-card-wide">
        <strong>Stored knowledge sources</strong>
        <p>These are the materials the bot uses to answer visitor questions.</p>
        <KnowledgeList entries={knowledgeEntries} deleteAction={deleteKnowledgeAction} />
      </article>
    </section>
  );
}
