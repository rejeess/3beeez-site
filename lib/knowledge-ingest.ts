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

const PAGE_LIMIT = 25;
const FETCH_TIMEOUT_MS = 8000;

async function fetchPageHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "3Beeez Knowledge Ingest" },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>\s*(https?:\/\/[^\s<]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) locs.push(m[1].trim());
  return locs;
}

function isCrawlable(url: string): boolean {
  return !/\.(jpg|jpeg|png|gif|webp|svg|pdf|zip|mp4|mp3|css|js|woff2?|ttf|eot|ico)(\?|#|$)/i.test(url);
}

async function discoverPageUrls(origin: string): Promise<string[]> {
  // 1. Try /sitemap.xml
  const sitemapXml = await fetchPageHtml(`${origin}/sitemap.xml`);
  if (sitemapXml) {
    let urls: string[];
    if (sitemapXml.includes("<sitemapindex")) {
      // Sitemap index — fetch up to 5 sub-sitemaps
      const subUrls = parseSitemapLocs(sitemapXml).slice(0, 5);
      const all: string[] = [];
      for (const sub of subUrls) {
        const subXml = await fetchPageHtml(sub);
        if (subXml) all.push(...parseSitemapLocs(subXml));
      }
      urls = all;
    } else {
      urls = parseSitemapLocs(sitemapXml);
    }

    const filtered = urls
      .filter((u) => {
        try { return new URL(u).hostname === new URL(origin).hostname; } catch { return false; }
      })
      .filter(isCrawlable);

    if (filtered.length > 0) return filtered.slice(0, PAGE_LIMIT);
  }

  // 2. Fallback: shallow crawl from homepage
  const homeHtml = await fetchPageHtml(origin);
  if (!homeHtml) return [origin];

  const links = new Set<string>([origin]);
  const re = /href=["']((https?:\/\/[^"'#?]+|\/[^"'#?]*))["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(homeHtml)) !== null) {
    try {
      const resolved = new URL(m[1], origin).href.split(/[?#]/)[0];
      if (new URL(resolved).hostname === new URL(origin).hostname && isCrawlable(resolved)) {
        links.add(resolved);
      }
    } catch { /* skip malformed */ }
  }
  return [...links].slice(0, PAGE_LIMIT);
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

export async function ingestWebsiteUrl(url: string): Promise<Array<{ title: string; content: string; url: string }>> {
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

  const origin = parsed.origin;
  const pageUrls = await discoverPageUrls(origin);

  // Ensure the submitted URL is included
  const normalised = url.split(/[?#]/)[0].replace(/\/$/, "");
  if (!pageUrls.some((u) => u.replace(/\/$/, "") === normalised)) {
    pageUrls.unshift(url);
  }

  const pages: Array<{ title: string; content: string; url: string }> = [];

  for (const pageUrl of pageUrls.slice(0, PAGE_LIMIT)) {
    const html = await fetchPageHtml(pageUrl);
    if (!html) continue;

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = cleanText(titleMatch?.[1] || pageUrl);
    const content = stripHtml(html).slice(0, 12000);

    if (content.length < 100) continue;

    pages.push({ title, content, url: pageUrl });
  }

  if (pages.length === 0) {
    throw new Error("Could not extract readable content from any page on this website.");
  }

  return pages;
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
