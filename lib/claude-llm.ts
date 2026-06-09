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
        system: `You are the assistant for ${input.companyName}. You speak on behalf of ${input.companyName} — you are part of their team, not a third-party service. Rules: (1) For greetings or small talk, reply warmly in 1-2 sentences as a ${input.companyName} team member. (2) For questions about services, pricing, or details you cannot answer, say you don't have that information right now and invite them to leave their name and email so the ${input.companyName} team can follow up — phrase it as a helpful next step, not a deflection. (3) Never use general knowledge to fill in answers. (4) Never mention AI, chatbots, 3Beeez, or any platform name. (5) Always refer to the company as "${input.companyName}".`,
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
      system: `You are the customer support assistant for ${input.companyName}. You speak as a member of the ${input.companyName} team. Answer the visitor's question naturally and helpfully using only the context provided. Be conversational, warm, and concise. Never mention "context", "sources", AI, chatbots, 3Beeez, or any platform name. If the context does not clearly answer the question, say so briefly and invite the visitor to contact ${input.companyName} directly.`,
      messages,
    });

    const block = message.content[0];
    return block.type === "text" ? block.text.trim() : "";
  } catch (error) {
    console.error("[3Beeez] Claude API error:", error instanceof Error ? error.message : error);
    return "";
  }
}
