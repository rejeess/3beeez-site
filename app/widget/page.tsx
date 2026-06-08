import { notFound } from "next/navigation";
import { ChatDemo } from "@/components/chat-demo";
import { getCompanyByBotId } from "@/lib/db";

type WidgetPageProps = {
  searchParams: Promise<{
    botId?: string;
    pageUrl?: string;
    iconColor?: string;
  }>;
};

const widgetPrompts = [
  "What is your return policy?",
  "Can you help me with onboarding?",
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
