import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "3Beeez | AI Chat Services for Modern Websites",
  description:
    "3Beeez builds embedded AI chat services for companies that want real-time answers trained on their documents, website content, and knowledge base.",
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
