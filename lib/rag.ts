const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "which",
  "who",
  "will",
  "with",
  "your",
  "offer",
  "offers",
  "offering",
  "provide",
  "provides",
  "providing",
  "available",
]);

const chunkSize = 700;
const chunkOverlap = 120;

export type SparseVector = Record<string, number>;

export type RetrievalChunk = {
  title: string;
  content: string;
  score: number;
  kind: string;
};

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = getKey(item);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function normalizeWhitespace(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

export function tokenizeForRetrieval(input: string) {
  return normalizeWhitespace(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !stopWords.has(token));
}

// Returns true if the query token matches the text, including word-family variants
// e.g. "price" matches "pricing", "priced"; "implement" matches "implementing"
export function tokenMatchesText(queryToken: string, text: string): boolean {
  if (text.includes(queryToken)) return true;
  // 4-char prefix covers most English word families (price→pric, pricing→pric)
  if (queryToken.length >= 5 && text.includes(queryToken.slice(0, 4))) return true;
  return false;
}

export function buildSparseVector(input: string) {
  const tokens = tokenizeForRetrieval(input);
  const vector: SparseVector = {};

  for (const token of tokens) {
    vector[token] = (vector[token] || 0) + 1;
  }

  return vector;
}

export function serializeVector(vector: SparseVector) {
  return JSON.stringify(vector);
}

export function deserializeVector(input: string) {
  return (JSON.parse(input) || {}) as SparseVector;
}

export function cosineSimilarity(left: SparseVector, right: SparseVector) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length === 0 || rightKeys.length === 0) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (const key of leftKeys) {
    const leftValue = left[key];
    leftMagnitude += leftValue * leftValue;
    dot += leftValue * (right[key] || 0);
  }

  for (const key of rightKeys) {
    const rightValue = right[key];
    rightMagnitude += rightValue * rightValue;
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

export function chunkKnowledgeContent(title: string, content: string) {
  const normalized = normalizeWhitespace(`${title}. ${content}`);

  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);

    if (end < normalized.length) {
      const sentenceBreak = normalized.lastIndexOf(". ", end);
      const paragraphBreak = normalized.lastIndexOf(" ", end);
      end = sentenceBreak > start + 250 ? sentenceBreak + 1 : Math.max(paragraphBreak, end);
    }

    const chunk = normalized.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(0, end - chunkOverlap);
  }

  return chunks;
}

const NAV_KEYWORDS = [
  "login", "logout", "sign up", "sign in", "log in", "log out",
  "my account", "shopping cart", "myducati", "mydomain",
];

function isNavDenseSentence(sentence: string) {
  const lowered = sentence.toLowerCase();
  return NAV_KEYWORDS.filter((kw) => lowered.includes(kw)).length >= 2;
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .flatMap((seg) =>
      seg.length > 500
        ? seg.split(/\s{2,}|\s*[|\/]\s*/).filter(Boolean)
        : [seg]
    )
    .map((s) => s.trim())
    .filter((s) => s.length >= 30 && s.length <= 500);
}

function scoreSentences(question: string, chunks: RetrievalChunk[]) {
  const queryTokens = tokenizeForRetrieval(question);

  return uniqueBy(
    chunks.flatMap((chunk) =>
      splitIntoSentences(chunk.content)
        .filter((sentence) => !/^source url:/i.test(sentence))
        .filter((sentence) => !/^https?:\/\//i.test(sentence))
        .filter((sentence) => !isNavDenseSentence(sentence))
        .map((sentence) => {
          const lower = sentence.toLowerCase();
          const tokenScore = queryTokens.reduce(
            (acc, token) => (tokenMatchesText(token, lower) ? acc + 1 : acc),
            0
          );
          return { sentence, tokenScore, score: tokenScore + chunk.score * 0.4 };
        })
        .filter((entry) => entry.tokenScore > 0)
    ),
    (entry) => normalizeWhitespace(entry.sentence).toLowerCase()
  )
    .sort((a, b) => b.score - a.score);
}

export function generateGroundedAnswer(
  companyName: string,
  question: string,
  chunks: RetrievalChunk[]
): string {
  if (chunks.length === 0) {
    return `${companyName}'s assistant does not have enough approved knowledge yet for that question. Ask the company admin to upload more website content, documents, or support notes.`;
  }

  const uniqueChunks = uniqueBy(
    chunks,
    (chunk) => `${chunk.title.toLowerCase()}::${normalizeWhitespace(chunk.content).toLowerCase()}`
  );

  const top = scoreSentences(question, uniqueChunks)
    .slice(0, 3)
    .map((entry) => entry.sentence);

  if (top.length > 0) {
    return top.join(" ");
  }

  return `I don't have specific information about that in my current knowledge base. Please reach out to the ${companyName} team directly and they'll be happy to help.`;
}
