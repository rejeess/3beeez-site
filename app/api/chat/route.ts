import { NextRequest, NextResponse } from "next/server";
import {
  addMessage,
  findRelevantKnowledgeEntry,
  getCompanyByBotId,
  getCompanyBySlug,
  upsertConversation,
} from "@/lib/db";

const welcomeMessage =
  "Welcome. I can answer questions about setup, training data, and how a 3Beeez website assistant would work for your business.";

const cannedReplies = [
  {
    match: ["documents", "learn from", "pdf", "files"],
    reply:
      "The assistant can be trained on PDFs, policy documents, support articles, product pages, onboarding guides, and approved website content so replies stay grounded in your business information.",
  },
  {
    match: ["add", "website", "script", "embed"],
    reply:
      "We provide a script tag that your client places on their site. That script loads a branded chat widget, connects it to the configured knowledge base, and starts handling visitor conversations in real time.",
  },
  {
    match: ["real time", "support", "quickly", "fast"],
    reply:
      "Yes. The goal is instant first-response support for website visitors, with answers based on client data and clear paths to collect leads or hand off to a human team when needed.",
  },
];

function resolveReply(message: string, knowledgeContext?: string) {
  if (knowledgeContext) {
    return knowledgeContext;
  }

  const normalized = message.toLowerCase();
  const match = cannedReplies.find((entry) =>
    entry.match.some((term) => normalized.includes(term))
  );

  if (match) {
    return match.reply;
  }

  return "3Beeez is designed to help companies launch an AI chat service that understands their own documents and website content, then answers visitors directly from an embedded website widget.";
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    conversationId?: string;
    companySlug?: string;
    botId?: string;
    visitorId?: string;
    sourceUrl?: string;
    message?: string;
    lead?: {
      name?: string;
      email?: string;
      company?: string;
    };
  };

  const message = body.message?.trim() || "";

  if (!message) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400 }
    );
  }

  const company =
    (body.botId ? getCompanyByBotId(body.botId) : undefined) ||
    getCompanyBySlug(body.companySlug || "3beeez");

  if (!company) {
    return NextResponse.json(
      { error: "Unknown company account." },
      { status: 400 }
    );
  }

  const conversation = await upsertConversation({
    publicId: body.conversationId,
    companyId: company.id,
    visitorId: body.visitorId,
    sourceUrl: body.sourceUrl,
    lead: body.lead,
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Unable to create conversation." },
      { status: 500 }
    );
  }

  if (conversation.messageCount === 0) {
    addMessage({
      conversationPublicId: conversation.publicId,
      role: "bot",
      content: welcomeMessage,
    });
  }

  addMessage({
    conversationPublicId: conversation.publicId,
    role: "user",
    content: message,
  });

  const knowledgeEntry = findRelevantKnowledgeEntry(company.id, message);
  const knowledgeReply = knowledgeEntry
    ? `Based on ${knowledgeEntry.kind} "${knowledgeEntry.title}", here is the best answer: ${knowledgeEntry.content}`
    : undefined;
  const reply = resolveReply(message, knowledgeReply);

  const botMessage = addMessage({
    conversationPublicId: conversation.publicId,
    role: "bot",
    content: reply,
  });

  return NextResponse.json({
    conversationId: conversation.publicId,
    companySlug: company.slug,
    visitorId: conversation.visitorId,
    reply: botMessage.content,
    lead: {
      name: conversation.leadName,
      email: conversation.leadEmail,
      company: conversation.leadCompany,
    },
  });
}
