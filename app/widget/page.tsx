import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatDemo } from "@/components/chat-demo";
import { getCompanyByBotId } from "@/lib/db";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type WidgetPageProps = {
  searchParams: Promise<{
    botId?: string;
    pageUrl?: string;
    iconColor?: string;
  }>;
};

const widgetPrompts = [
  "What services do you offer?",
  "How can I get in touch?",
];

export default async function WidgetPage({ searchParams }: WidgetPageProps) {
  const { botId, pageUrl, iconColor } = await searchParams;
  const company = botId ? getCompanyByBotId(botId) : undefined;

  if (!company) {
    notFound();
  }

  return (
    <main className="widget-page">
      <ChatDemo
        botId={company.botId}
        companyName={company.name}
        companySlug={company.slug}
        promptChips={widgetPrompts}
        variant="widget"
        pageUrl={pageUrl}
        iconColor={iconColor}
      />
    </main>
  );
}
