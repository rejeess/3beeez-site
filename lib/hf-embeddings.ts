import "server-only";

function getEmbeddingApiUrl() {
  return process.env.HF_EMBEDDING_API_URL?.trim() || "";
}

function getEmbeddingApiToken() {
  return process.env.HF_API_TOKEN?.trim() || "";
}

function getEmbeddingPrefix(mode: "query" | "passage") {
  const strategy = process.env.HF_EMBEDDING_PROMPT_MODE?.trim().toLowerCase() || "e5";

  if (strategy === "none") {
    return "";
  }

  if (strategy === "e5") {
    return mode === "query" ? "query: " : "passage: ";
  }

  return "";
}

export function isEmbeddingProviderConfigured() {
  return Boolean(getEmbeddingApiUrl() && getEmbeddingApiToken());
}

export async function embedTexts(
  texts: string[],
  mode: "query" | "passage"
) {
  const url = getEmbeddingApiUrl();
  const token = getEmbeddingApiToken();

  if (!url || !token) {
    throw new Error("Hugging Face embedding provider is not configured.");
  }

  const inputs = texts.map((text) => `${getEmbeddingPrefix(mode)}${text}`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs,
      normalize: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Embedding request failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as number[] | number[][];

  if (!Array.isArray(payload)) {
    throw new Error("Unexpected embedding response payload.");
  }

  if (payload.length === 0) {
    return [] as number[][];
  }

  if (Array.isArray(payload[0])) {
    return payload as number[][];
  }

  return [payload as number[]];
}

export async function embedText(text: string, mode: "query" | "passage") {
  const [embedding] = await embedTexts([text], mode);

  if (!embedding) {
    throw new Error("No embedding returned for input text.");
  }

  return embedding;
}
