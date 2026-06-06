import "server-only";
import Anthropic from "@anthropic-ai/sdk";

type ChunkInput = {
  title: string;
  content: string;
};

type HistoryMessage = { role: "user" | "bot"; content: string };

let client: Anthropic | null = null;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export function isClaudeLlmConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export async function synthesizeWithClaude(input: {
  companyName: string;
  question: string;
  chunks: ChunkInput[];
  history?: HistoryMessage[];
}): Promise<string> {
  const anthropic = getClient();
  if (!anthropic) return "";

  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5-20251001";

  type Turn = Anthropic.MessageParam;

  const priorTurns: Turn[] = (input.history ?? [])
    .map((msg) => ({
      role: (msg.role === "bot" ? "assistant" : "user") as "user" | "assistant",
      content: msg.content,
    }));

  // Anthropic requires the first message to be from "user" — drop any leading assistant turns
  const firstUserIdx = priorTurns.findIndex((m) => m.role === "user");
  const trimmedPriorTurns = firstUserIdx >= 0 ? priorTurns.slice(firstUserIdx) : [];

  try {
    if (input.chunks.length === 0) {
      // No knowledge match — conversational mode for greetings, small talk, or unanswerable questions
      const messages: Turn[] = [
        ...trimmedPriorTurns,
        { role: "user", content: input.question },
      ];

      const message = await anthropic.messages.create({
        model,
        max_tokens: 120,
        system: `You are the friendly support assistant for ${input.companyName}. For greetings and small talk, respond warmly and naturally in 1-2 short sentences. For questions you don't have information about, honestly say you don't have that detail and suggest the visitor contact the ${input.companyName} team directly. Never make up information. Never mention you are an AI.`,
        messages,
      });

      const block = message.content[0];
      return block.type === "text" ? block.text.trim() : "";
    }

    const context = input.chunks
      .map((chunk, i) => `[${i + 1}] ${chunk.title}\n${chunk.content}`)
      .join("\n\n");

    const messages: Turn[] = [
      ...trimmedPriorTurns,
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${input.question}` },
    ];

    const message = await anthropic.messages.create({
      model,
      max_tokens: 350,
      system: `You are the customer support assistant for ${input.companyName}. Answer the visitor's question naturally and helpfully using only the context provided. Be conversational, warm, and concise — write like a knowledgeable human support agent, not a search engine. Never mention "context", "sources", or that you are an AI. If the context does not clearly answer the question, say so briefly and suggest the visitor contact the team directly.`,
      messages,
    });

    const block = message.content[0];
    return block.type === "text" ? block.text.trim() : "";
  } catch (error) {
    console.error("[3Beeez] Claude API error:", error instanceof Error ? error.message : error);
    return "";
  }
}
