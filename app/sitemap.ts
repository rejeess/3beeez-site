import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_BASE_URL || "https://3beeez.com";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/purchase`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];
}
