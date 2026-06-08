
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.86.36"],
  reactStrictMode: true,
  devIndicators: false,
  turbopack: {},
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/data/**", "**/.git/**", "**/.next/**"],
    };
    return config;
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
