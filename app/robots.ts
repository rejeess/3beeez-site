import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_BASE_URL || "https://3beeez.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/portal/",
        "/login/",
        "/widget",
        "/widget-script",
        "/api/",
        "/purchase-success/",
        "/test-site/",
        "/purchase-demo/",
        "/checkout",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
