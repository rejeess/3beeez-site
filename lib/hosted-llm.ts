import "server-only";

type LlmChunk = {
  title: string;
  content: string;
};

type HistoryMessage = { role: "user" | "bot"; content: string };

function getLlmConfig() {
  return {
    url: process.env.LLM_API_URL?.trim() || "",
    apiKey: process.env.LLM_API_KEY?.trim() || "",
    model: process.env.LLM_MODEL?.trim() || "",
  };
}

export function isHostedLlmConfigured() {
  const config = getLlmConfig();
  return Boolean(config.url && config.apiKey && config.model);
}

export async function synthesizeHostedAnswer(input: {
  companyName: string;
  question: string;
  chunks: LlmChunk[];
  history?: HistoryMessage[];
}) {
  const config = getLlmConfig();

  if (!config.url || !config.apiKey || !config.model || input.chunks.length === 0) {
    return "";
  }

  const context = input.chunks
    .map((chunk, index) => `Source ${index + 1} - ${chunk.title}\n${chunk.content}`)
    .join("\n\n");

  type Turn = { role: "user" | "assistant"; content: string };

  const priorTurns: Turn[] = (input.history ?? [])
    .map((msg) => ({
      role: (msg.role === "bot" ? "assistant" : "user") as "user" | "assistant",
      content: msg.content,
    }));

  // OpenAI-compatible APIs also require the first message to be "user"
  const firstUserIdx = priorTurns.findIndex((m) => m.role === "user");
  const trimmedPriorTurns = firstUserIdx >= 0 ? priorTurns.slice(firstUserIdx) : [];

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are the website assistant for ${input.companyName}. Answer as the company, not as 3Beeez. Be concise, natural, and conversational. Use only the supplied context. If the answer is not clear from the context, say so briefly without inventing facts.`,
        },
        ...trimmedPriorTurns,
        {
          role: "user",
          content: `Question:\n${input.question}\n\nApproved context:\n${context}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return "";
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  return payload.choices?.[0]?.message?.content?.trim() || "";
}
