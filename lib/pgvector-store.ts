import "server-only";
import { Pool } from "pg";
import type { KnowledgeEntryRecord } from "@/lib/db";
import { embedText, embedTexts, isEmbeddingProviderConfigured } from "@/lib/hf-embeddings";
import { chunkKnowledgeContent } from "@/lib/rag";

type PgRetrievalChunk = {
  title: string;
  content: string;
  score: number;
  kind: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __threeBeeezPgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __threeBeeezPgSchemaReady: boolean | undefined;
}

function getDatabaseUrl() {
  return process.env.DATABASE_URL?.trim() || "";
}

function getVectorDimensions() {
  const raw = process.env.PGVECTOR_DIMENSIONS?.trim() || "";
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1024;
}

function vectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

function getPool() {
  if (!global.__threeBeeezPgPool) {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured.");
    }

    global.__threeBeeezPgPool = new Pool({
      connectionString,
    });
  }

  return global.__threeBeeezPgPool;
}

export function isPgvectorConfigured() {
  return Boolean(getDatabaseUrl() && isEmbeddingProviderConfigured());
}

export async function ensurePgvectorSchema() {
  if (!isPgvectorConfigured()) {
    return;
  }

  if (global.__threeBeeezPgSchemaReady) {
    return;
  }

  const pool = getPool();
  const dimensions = getVectorDimensions();

  await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rag_chunks (
      id BIGSERIAL PRIMARY KEY,
      knowledge_entry_id BIGINT NOT NULL,
      company_id BIGINT NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      embedding vector(${dimensions}) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(
    "CREATE INDEX IF NOT EXISTS rag_chunks_company_id_idx ON rag_chunks (company_id)"
  );
  await pool.query(
    "CREATE INDEX IF NOT EXISTS rag_chunks_embedding_hnsw_idx ON rag_chunks USING hnsw (embedding vector_cosine_ops)"
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rag_models (
      company_id BIGINT PRIMARY KEY,
      source_count INTEGER NOT NULL,
      chunk_count INTEGER NOT NULL,
      trained_at TIMESTAMPTZ NOT NULL
    )
  `);

  global.__threeBeeezPgSchemaReady = true;
}

export async function indexKnowledgeEntryInPgvector(entry: KnowledgeEntryRecord) {
  if (!isPgvectorConfigured()) {
    return;
  }

  await ensurePgvectorSchema();

  const chunks = chunkKnowledgeContent(entry.title, entry.content);

  if (chunks.length === 0) {
    return;
  }

  const embeddings = await embedTexts(chunks, "passage");
  const pool = getPool();

  await pool.query("DELETE FROM rag_chunks WHERE knowledge_entry_id = $1", [entry.id]);

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const embedding = embeddings[index];

    if (!embedding) {
      continue;
    }

    await pool.query(
      `
        INSERT INTO rag_chunks (
          knowledge_entry_id,
          company_id,
          kind,
          title,
          content,
          chunk_index,
          embedding
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
      `,
      [
        entry.id,
        entry.companyId,
        entry.kind,
        entry.title,
        chunk,
        index,
        vectorLiteral(embedding),
      ]
    );
  }

  await pool.query(
    `
      INSERT INTO rag_models (company_id, source_count, chunk_count, trained_at)
      VALUES (
        $1,
        (SELECT COUNT(*)::int FROM rag_chunks WHERE company_id = $1),
        (SELECT COUNT(*)::int FROM rag_chunks WHERE company_id = $1),
        NOW()
      )
      ON CONFLICT (company_id) DO UPDATE SET
        source_count = (SELECT COUNT(DISTINCT knowledge_entry_id)::int FROM rag_chunks WHERE company_id = $1),
        chunk_count = (SELECT COUNT(*)::int FROM rag_chunks WHERE company_id = $1),
        trained_at = NOW()
    `,
    [entry.companyId]
  );
}

export async function retrieveRelevantPgvectorChunks(companyId: number, message: string, limit = 4) {
  if (!isPgvectorConfigured()) {
    return [] as PgRetrievalChunk[];
  }

  await ensurePgvectorSchema();

  const embedding = await embedText(message, "query");
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT
        title,
        content,
        kind,
        1 - (embedding <=> $2::vector) as score
      FROM rag_chunks
      WHERE company_id = $1
      ORDER BY embedding <=> $2::vector
      LIMIT $3
    `,
    [companyId, vectorLiteral(embedding), limit]
  );

  return result.rows.map((row) => ({
    title: String(row.title),
    content: String(row.content),
    kind: String(row.kind),
    score: Number(row.score || 0),
  }));
}
