import { NextRequest, NextResponse } from "next/server";
import {
  addMessage,
  getCompanyByBotId,
  getCompanyBySlug,
  getRecentMessagesForConversation,
  isDomainAllowed,
  upsertConversation,
} from "@/lib/db";
import { buildChatAnswer, retrieveKnowledgeForQuestion } from "@/lib/knowledge-service";

function createWelcomeMessage(companyName: string) {
  return `Welcome to ${companyName}. I can help answer questions using ${companyName}'s approved website content, documents, and support information.`;
}

export async function POST(request: NextRequest) {
  try {
    return await handlePost(request);
  } catch (error) {
    console.error("[3Beeez] /api/chat unhandled error:", error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

async function handlePost(request: NextRequest) {
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
      phone?: string;
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

  if (company.status !== "active") {
    return NextResponse.json(
      { error: "This account is not active." },
      { status: 403 }
    );
  }

  // Use HTTP Referer/Origin as the authoritative domain check — these are
  // set by the browser and cannot be spoofed by client-supplied body fields.
  const requestOrigin =
    request.headers.get("origin") ||
    request.headers.get("referer") ||
    body.sourceUrl ||
    "";
  if (!isDomainAllowed(company.allowedDomain, requestOrigin)) {
    return NextResponse.json(
      { error: "This chatbot is not authorized for this domain." },
      { status: 403 }
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
      content: createWelcomeMessage(company.name),
    });
  }

  // Fetch prior turns before adding the current message so history reflects the conversation so far
  const recentHistory = getRecentMessagesForConversation(conversation.publicId, 4);

  addMessage({
    conversationPublicId: conversation.publicId,
    role: "user",
    content: message,
  });

  const groundedChunks = await retrieveKnowledgeForQuestion(company.id, message, 4);
  const reply = await buildChatAnswer({
    companyName: company.name,
    question: message,
    chunks: groundedChunks,
    history: recentHistory,
  });

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
    sources: groundedChunks.map((chunk) => ({
      title: chunk.title,
      kind: chunk.kind,
      score: Number(chunk.score.toFixed(3)),
    })),
    lead: {
      name: conversation.leadName,
      email: conversation.leadEmail,
      company: conversation.leadCompany,
    },
  });
}

