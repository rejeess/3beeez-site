import "server-only";

function cleanText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function isNavFragment(line: string) {
  const lowered = line.toLowerCase();

  if (
    lowered.includes("quick links") ||
    lowered.includes("contact info") ||
    lowered.includes("copyright") ||
    lowered.includes("all rights reserved") ||
    lowered.includes("privacy policy") ||
    lowered.includes("terms of service") ||
    lowered.includes("cookie policy") ||
    lowered.includes("skip to content") ||
    lowered.includes("sign in") ||
    lowered.includes("sign up") ||
    lowered.includes("log in") ||
    lowered.includes("log out") ||
    lowered.includes("my account") ||
    lowered.includes("shopping cart") ||
    /\+?\d[\d\s()-]{7,}/.test(line) ||
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(line)
  ) {
    return true;
  }

  // Drop short fragments with no sentence structure (nav menu items)
  const wordCount = line.trim().split(/\s+/).length;
  if (wordCount <= 4 && !/[.!?]$/.test(line.trim())) {
    return true;
  }

  return false;
}

function cleanWebsiteText(input: string) {
  return input
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => cleanText(line))
    .filter(Boolean)
    .filter((line) => !isNavFragment(line))
    .join(" ");
}

function stripHtml(html: string) {
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  const source = mainMatch?.[0] || articleMatch?.[0] || html;

  return cleanWebsiteText(
    source
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
      .replace(/<form[\s\S]*?<\/form>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
  );
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "169.254.169.254", // AWS/GCP instance metadata
  "metadata.google.internal",
]);

function isPrivateHostname(hostname: string): boolean {
  if (BLOCKED_HOSTNAMES.has(hostname)) return true;
  // Private IPv4 ranges
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;
  if (/^100\.6[4-9]\./.test(hostname)) return true; // CGNAT
  return false;
}

export async function ingestWebsiteUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only http and https URLs are allowed.");
  }

  if (isPrivateHostname(parsed.hostname.toLowerCase())) {
    throw new Error("URL points to a private or reserved address.");
  }

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
  const { extractText } = await import("unpdf");
  const buffer = await file.arrayBuffer();
  const result = await extractText(new Uint8Array(buffer), { mergePages: true });
  const text = result.text ?? "";

  if (!cleanText(text)) {
    throw new Error("Unable to extract readable text from this PDF.");
  }

  return {
    title: file.name.replace(/\.pdf$/i, "") || "PDF document",
    content: cleanText(text).slice(0, 12000),
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
