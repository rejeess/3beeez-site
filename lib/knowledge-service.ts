import "server-only";
import {
  addKnowledgeEntry,
  type KnowledgeEntryRecord,
  retrieveRelevantKnowledgeChunks,
} from "@/lib/db";
import {
  indexKnowledgeEntryInPgvector,
  isPgvectorConfigured,
  retrieveRelevantPgvectorChunks,
} from "@/lib/pgvector-store";
import { synthesizeWithClaude } from "@/lib/claude-llm";
import { synthesizeHostedAnswer } from "@/lib/hosted-llm";
import { generateGroundedAnswer } from "@/lib/rag";

type StoredKnowledgeInput = {
  companyId: number;
  kind: KnowledgeEntryRecord["kind"];
  title: string;
  content: string;
};

export async function storeKnowledgeSource(input: StoredKnowledgeInput) {
  const entry = addKnowledgeEntry(input);

  if (isPgvectorConfigured()) {
    await indexKnowledgeEntryInPgvector(entry);
  }

  return entry;
}

export async function retrieveKnowledgeForQuestion(companyId: number, message: string, limit = 4) {
  if (isPgvectorConfigured()) {
    const chunks = await retrieveRelevantPgvectorChunks(companyId, message, limit);

    if (chunks.length > 0) {
      return chunks;
    }
  }

  return retrieveRelevantKnowledgeChunks(companyId, message, limit);
}

type HistoryMessage = { role: "user" | "bot"; content: string };

export async function buildChatAnswer(input: {
  companyName: string;
  question: string;
  chunks: Array<{ title: string; content: string; score: number; kind: string }>;
  history?: HistoryMessage[];
}) {
  const chunkInputs = input.chunks.map((chunk) => ({
    title: chunk.title,
    content: chunk.content,
  }));

  // Claude handles both knowledge-based answers and conversational messages (greetings, no-match)
  const claude = await synthesizeWithClaude({
    companyName: input.companyName,
    question: input.question,
    chunks: chunkInputs,
    history: input.history,
  });
  if (claude) return claude;

  // Hosted LLM only used when there are knowledge chunks to ground it
  if (chunkInputs.length > 0) {
    const hosted = await synthesizeHostedAnswer({
      companyName: input.companyName,
      question: input.question,
      chunks: chunkInputs,
      history: input.history,
    });
    if (hosted) return hosted;

    return generateGroundedAnswer(input.companyName, input.question, input.chunks);
  }

  return `I'm not sure about that one — I'd recommend reaching out to the ${input.companyName} team directly and they'll be happy to help!`;
}
