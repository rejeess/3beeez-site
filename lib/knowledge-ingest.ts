import "server-only";
import { promisify } from "node:util";
import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const execFile = promisify(execFileCallback);

function cleanText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function stripHtml(html: string) {
  return cleanText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
  );
}

export async function ingestWebsiteUrl(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "3Beeez Local Knowledge Ingest",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch website content (${response.status}).`);
  }

  const html = await response.text();
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);

  return {
    title: cleanText(titleMatch?.[1] || url),
    content: stripHtml(html).slice(0, 12000),
  };
}

export async function ingestPdfFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const tempDir = await mkdtemp(join(tmpdir(), "threebeeez-pdf-"));
  const tempFilePath = join(tempDir, file.name || "upload.pdf");
  await writeFile(tempFilePath, buffer);

  let extracted = "";

  try {
    const { stdout } = await execFile("/usr/bin/strings", ["-n", "6", tempFilePath]);
    extracted = stdout;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  if (!cleanText(extracted)) {
    throw new Error("Unable to extract readable text from this PDF for local testing.");
  }

  return {
    title: file.name.replace(/\.pdf$/i, "") || "PDF document",
    content: cleanText(extracted).slice(0, 12000),
  };
}

export async function ingestWordFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mammoth = await import("mammoth");
  const parsed = await mammoth.extractRawText({ buffer });

  return {
    title: file.name.replace(/\.(docx|doc)$/i, "") || "Word document",
    content: cleanText(parsed.value).slice(0, 12000),
  };
}
