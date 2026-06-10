import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const baseUrl = process.env.APP_BASE_URL || "https://3beeez.com";

export const metadata: Metadata = {
  title: "3Beeez | AI Chat Services for Modern Websites",
  description:
    "3Beeez builds embedded AI chat services for companies that want real-time answers trained on their documents, website content, and knowledge base.",
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: "3Beeez | AI Chat Services for Modern Websites",
    description:
      "Embedded AI chat services trained on your own knowledge base — documents, website content, and FAQs.",
    url: baseUrl,
    siteName: "3Beeez",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "3Beeez | AI Chat Services for Modern Websites",
    description:
      "Embedded AI chat services trained on your own knowledge base — documents, website content, and FAQs.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
