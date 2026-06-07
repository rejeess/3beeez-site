import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "192.168.86.36"],
  reactStrictMode: true,
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        // Apply base security headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Prevent admin/portal pages from being framed by third-party sites
        source: "/(admin|portal|login|purchase)(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
