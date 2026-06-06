import "server-only";
import { existsSync, mkdirSync } from "node:fs";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getPurchaseMode } from "@/lib/purchase";
import {
  buildSparseVector,
  chunkKnowledgeContent,
  cosineSimilarity,
  deserializeVector,
  serializeVector,
  tokenizeForRetrieval,
  tokenMatchesText,
} from "@/lib/rag";

export type CompanyStatus = "active" | "suspended" | "expired";

export type CompanyRecord = {
  id: number;
  slug: string;
  name: string;
  botId: string;
  allowedDomain: string;
  status: CompanyStatus;
  installToken: string;
};

export type UserRole = "owner" | "client_admin";

export type UserRecord = {
  id: number;
  companyId: number | null;
  email: string;
  name: string;
  role: UserRole;
};

export type MessageRecord = {
  id: number;
  publicId: string;
  role: "user" | "bot";
  content: string;
  createdAt: string;
};

export type ConversationRecord = {
  id: number;
  publicId: string;
  companyId: number;
  companySlug: string;
  companyName: string;
  visitorId: string;
  sourceUrl: string;
  leadName: string;
  leadEmail: string;
  leadCompany: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

export type ConversationWithMessages = ConversationRecord & {
  messages: MessageRecord[];
};

export type KnowledgeEntryRecord = {
  id: number;
  companyId: number;
  kind: "document" | "website" | "history" | "pdf" | "word";
  title: string;
  content: string;
  createdAt: string;
};

export type KnowledgeChunkRecord = {
  id: number;
  knowledgeEntryId: number;
  companyId: number;
  kind: KnowledgeEntryRecord["kind"];
  title: string;
  content: string;
  chunkIndex: number;
  vectorJson: string;
  createdAt: string;
};

export type KnowledgeChunkMatch = KnowledgeChunkRecord & {
  score: number;
};

export type KnowledgeModelRecord = {
  companyId: number;
  sourceCount: number;
  chunkCount: number;
  trainedAt: string;
};

export type PurchaseOrderRecord = {
  id: number;
  publicId: string;
  companyId: number;
  companySlug: string;
  companyName: string;
  planId: string;
  billingLabel: string;
  contactName: string;
  adminEmail: string;
  websiteUrl: string;
  iconColor: string;
  cardLast4: string;
  tempPassword: string;
  loginUrl: string;
  scriptSnippet: string;
  createdAt: string;
};

const dataDir = join(process.cwd(), "data");
const dbPath = join(dataDir, "app.db");

declare global {
  // eslint-disable-next-line no-var
  var __threeBeeezDb: DatabaseSync | undefined;
}

function generateInstallToken() {
  return randomBytes(20).toString("hex");
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.trim());
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function isDomainAllowed(allowedDomain: string, originOrUrl: string): boolean {
  if (!allowedDomain) return true;
  if (!originOrUrl) return false;

  const lower = originOrUrl.toLowerCase();
  if (lower.includes("localhost") || lower.includes("127.0.0.1")) return true;

  try {
    const parsed = new URL(originOrUrl);
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    return hostname === allowedDomain || hostname.endsWith(`.${allowedDomain}`);
  } catch {
    return false;
  }
}

function createId(prefix: string) {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");

  if (!salt || !hash) {
    return false;
  }

  const left = scryptSync(password, salt, 64);
  const right = Buffer.from(hash, "hex");

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function seedUser(
  db: DatabaseSync,
  input: {
    companyId: number | null;
    email: string;
    name: string;
    role: UserRole;
    password: string;
  }
) {
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(input.email) as { id: number } | undefined;

  if (existing) {
    return;
  }

  db.prepare(
    `
      INSERT INTO users (company_id, email, name, role, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `
  ).run(
    input.companyId,
    input.email,
    input.name,
    input.role,
    createPasswordHash(input.password),
    new Date().toISOString()
  );
}

function initialize(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      bot_id TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      company_id INTEGER NOT NULL,
      visitor_id TEXT NOT NULL,
      source_url TEXT NOT NULL DEFAULT '',
      lead_name TEXT NOT NULL DEFAULT '',
      lead_email TEXT NOT NULL DEFAULT '',
      lead_company TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      knowledge_entry_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      vector_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (knowledge_entry_id) REFERENCES knowledge_entries(id),
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_models (
      company_id INTEGER PRIMARY KEY,
      source_count INTEGER NOT NULL,
      chunk_count INTEGER NOT NULL,
      trained_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      company_id INTEGER NOT NULL,
      plan_id TEXT NOT NULL,
      billing_label TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      admin_email TEXT NOT NULL,
      website_url TEXT NOT NULL,
      icon_color TEXT NOT NULL,
      card_last4 TEXT NOT NULL,
      temp_password TEXT NOT NULL,
      login_url TEXT NOT NULL,
      script_snippet TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );
  `);

  const companyColumns = db.prepare("PRAGMA table_info(companies)").all() as Array<{ name: string }>;
  if (!companyColumns.some((col) => col.name === "allowed_domain")) {
    db.exec("ALTER TABLE companies ADD COLUMN allowed_domain TEXT NOT NULL DEFAULT ''");
  }
  if (!companyColumns.some((col) => col.name === "status")) {
    db.exec("ALTER TABLE companies ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  }
  if (!companyColumns.some((col) => col.name === "install_token")) {
    db.exec("ALTER TABLE companies ADD COLUMN install_token TEXT NOT NULL DEFAULT ''");
  }

  const now = new Date().toISOString();

  db.prepare(
    `
      INSERT OR IGNORE INTO companies (slug, name, bot_id, created_at)
      VALUES (?, ?, ?, ?)
    `
  ).run("3beeez", "3Beeez", "3beeez-main", now);

  db.prepare(
    `
      INSERT OR IGNORE INTO companies (slug, name, bot_id, created_at)
      VALUES (?, ?, ?, ?)
    `
  ).run("acme-support", "Acme Support", "acme-support", now);

  const companies = listCompanies(db);
  const companyMap = new Map(companies.map((company) => [company.slug, company.id]));

  db.prepare(
    "UPDATE companies SET allowed_domain = 'localhost' WHERE slug = 'acme-support' AND allowed_domain = ''"
  ).run();

  for (const company of companies) {
    if (!company.installToken) {
      db.prepare("UPDATE companies SET install_token = ? WHERE id = ?").run(
        generateInstallToken(),
        company.id
      );
    }
  }

  seedUser(db, {
    companyId: companyMap.get("3beeez") ?? null,
    email: "owner@3beeez.com",
    name: "3Beeez Owner",
    role: "owner",
    password: "OwnerPass!2026",
  });

  seedUser(db, {
    companyId: companyMap.get("acme-support") ?? null,
    email: "admin@acme-support.com",
    name: "Acme Admin",
    role: "client_admin",
    password: "AcmePortal!2026",
  });

  const hasKnowledge = db
    .prepare("SELECT id FROM knowledge_entries LIMIT 1")
    .get() as { id: number } | undefined;

  if (!hasKnowledge && companyMap.get("acme-support")) {
    const companyId = companyMap.get("acme-support") as number;
    const insertKnowledge = db.prepare(
      `
        INSERT INTO knowledge_entries (company_id, kind, title, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `
    );

    insertKnowledge.run(
      companyId,
      "document",
      "Returns and Warranty Policy",
      "Acme Support offers 30-day returns on unused hardware. Premium scanners include a 2-year replacement warranty and email support within 2 business hours.",
      now
    );

    insertKnowledge.run(
      companyId,
      "website",
      "Implementation Guide",
      "Client websites install the support assistant by adding the Acme widget script before the closing body tag. Most launches are completed in under 30 minutes.",
      now
    );

    insertKnowledge.run(
      companyId,
      "history",
      "Past support insights",
      "Customers frequently ask about scanner setup, shipping timelines, warranty coverage, and whether onboarding calls are included with enterprise plans.",
      now
    );
  }

  backfillKnowledgeChunks(db);
}

export function getDb() {
  if (!global.__threeBeeezDb) {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    global.__threeBeeezDb = new DatabaseSync(dbPath);
  }

  initialize(global.__threeBeeezDb);

  return global.__threeBeeezDb;
}

function listKnowledgeEntryRows(db = getDb()) {
  return db
    .prepare(
      `
        SELECT
          id,
          company_id as companyId,
          kind,
          title,
          content,
          created_at as createdAt
        FROM knowledge_entries
        ORDER BY id ASC
      `
    )
    .all() as KnowledgeEntryRecord[];
}

function rebuildKnowledgeModel(companyId: number, db = getDb()) {
  const sourceCountRow = db
    .prepare("SELECT COUNT(*) as count FROM knowledge_entries WHERE company_id = ?")
    .get(companyId) as { count: number };
  const chunkCountRow = db
    .prepare("SELECT COUNT(*) as count FROM knowledge_chunks WHERE company_id = ?")
    .get(companyId) as { count: number };

  db.prepare(
    `
      INSERT INTO knowledge_models (company_id, source_count, chunk_count, trained_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(company_id) DO UPDATE SET
        source_count = excluded.source_count,
        chunk_count = excluded.chunk_count,
        trained_at = excluded.trained_at
    `
  ).run(
    companyId,
    sourceCountRow.count,
    chunkCountRow.count,
    new Date().toISOString()
  );
}

function indexKnowledgeEntry(entry: KnowledgeEntryRecord, db = getDb()) {
  db.prepare("DELETE FROM knowledge_chunks WHERE knowledge_entry_id = ?").run(entry.id);

  const chunks = chunkKnowledgeContent(entry.title, entry.content);
  const insertChunk = db.prepare(
    `
      INSERT INTO knowledge_chunks (
        knowledge_entry_id,
        company_id,
        kind,
        title,
        content,
        chunk_index,
        vector_json,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
  );

  chunks.forEach((chunk, index) => {
    insertChunk.run(
      entry.id,
      entry.companyId,
      entry.kind,
      entry.title,
      chunk,
      index,
      serializeVector(buildSparseVector(chunk)),
      new Date().toISOString()
    );
  });

  rebuildKnowledgeModel(entry.companyId, db);
}

function backfillKnowledgeChunks(db = getDb()) {
  const entries = listKnowledgeEntryRows(db);
  const statement = db.prepare(
    "SELECT id FROM knowledge_chunks WHERE knowledge_entry_id = ? LIMIT 1"
  );

  for (const entry of entries) {
    const hasChunk = statement.get(entry.id) as { id: number } | undefined;

    if (!hasChunk) {
      indexKnowledgeEntry(entry, db);
    }
  }
}

export function listCompanies(db = getDb()) {
  return db
    .prepare("SELECT id, slug, name, bot_id as botId, allowed_domain as allowedDomain, status, install_token as installToken FROM companies ORDER BY name")
    .all() as CompanyRecord[];
}

export function getCompanyBySlug(slug: string) {
  return getDb()
    .prepare("SELECT id, slug, name, bot_id as botId, allowed_domain as allowedDomain, status, install_token as installToken FROM companies WHERE slug = ?")
    .get(slug) as CompanyRecord | undefined;
}

export function getCompanyByBotId(botId: string) {
  return getDb()
    .prepare("SELECT id, slug, name, bot_id as botId, allowed_domain as allowedDomain, status, install_token as installToken FROM companies WHERE bot_id = ?")
    .get(botId) as CompanyRecord | undefined;
}

export function findUserByEmail(email: string) {
  return getDb()
    .prepare(
      `
        SELECT id, company_id as companyId, email, name, role, password_hash as passwordHash
        FROM users
        WHERE email = ?
      `
    )
    .get(email) as (UserRecord & { passwordHash: string }) | undefined;
}

export function createSession(userId: number) {
  const token = randomBytes(24).toString("hex");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 14);

  getDb()
    .prepare(
      `
        INSERT INTO sessions (token, user_id, expires_at, created_at)
        VALUES (?, ?, ?, ?)
      `
    )
    .run(token, userId, expiresAt.toISOString(), createdAt.toISOString());

  return { token, expiresAt };
}

export function deleteSession(token: string) {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function findSession(token: string) {
  return getDb()
    .prepare(
      `
        SELECT
          sessions.token,
          sessions.expires_at as expiresAt,
          users.id,
          users.company_id as companyId,
          users.email,
          users.name,
          users.role
        FROM sessions
        INNER JOIN users ON users.id = sessions.user_id
        WHERE sessions.token = ?
      `
    )
    .get(token) as ({ token: string; expiresAt: string } & UserRecord) | undefined;
}

export function upsertConversation(input: {
  publicId?: string;
  companyId: number;
  visitorId?: string;
  sourceUrl?: string;
  lead?: {
    name?: string;
    email?: string;
    company?: string;
  };
}) {
  const db = getDb();
  const now = new Date().toISOString();

  if (input.publicId) {
    const existing = db
      .prepare("SELECT id FROM conversations WHERE public_id = ?")
      .get(input.publicId) as { id: number } | undefined;

    if (existing) {
      db.prepare(
        `
          UPDATE conversations
          SET company_id = ?,
              source_url = COALESCE(NULLIF(?, ''), source_url),
              lead_name = COALESCE(NULLIF(?, ''), lead_name),
              lead_email = COALESCE(NULLIF(?, ''), lead_email),
              lead_company = COALESCE(NULLIF(?, ''), lead_company),
              updated_at = ?
          WHERE id = ?
        `
      ).run(
        input.companyId,
        input.sourceUrl || "",
        input.lead?.name?.trim() || "",
        input.lead?.email?.trim() || "",
        input.lead?.company?.trim() || "",
        now,
        existing.id
      );

      return getConversationByPublicId(input.publicId);
    }
  }

  const publicId = input.publicId || createId("conv");
  const visitorId = input.visitorId || createId("visitor");

  db.prepare(
    `
      INSERT INTO conversations (
        public_id,
        company_id,
        visitor_id,
        source_url,
        lead_name,
        lead_email,
        lead_company,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    publicId,
    input.companyId,
    visitorId,
    input.sourceUrl || "",
    input.lead?.name?.trim() || "",
    input.lead?.email?.trim() || "",
    input.lead?.company?.trim() || "",
    now,
    now
  );

  return getConversationByPublicId(publicId);
}

export function addMessage(input: {
  conversationPublicId: string;
  role: "user" | "bot";
  content: string;
}) {
  const db = getDb();
  const conversation = db
    .prepare("SELECT id FROM conversations WHERE public_id = ?")
    .get(input.conversationPublicId) as { id: number } | undefined;

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const publicId = createId("msg");
  const createdAt = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO messages (public_id, conversation_id, role, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `
  ).run(publicId, conversation.id, input.role, input.content, createdAt);

  db.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(
    createdAt,
    conversation.id
  );

  return {
    publicId,
    role: input.role,
    content: input.content,
    createdAt,
  };
}

export function getConversationByPublicId(publicId: string) {
  return getDb()
    .prepare(
      `
        SELECT
          conversations.id,
          conversations.public_id as publicId,
          conversations.company_id as companyId,
          companies.slug as companySlug,
          companies.name as companyName,
          conversations.visitor_id as visitorId,
          conversations.source_url as sourceUrl,
          conversations.lead_name as leadName,
          conversations.lead_email as leadEmail,
          conversations.lead_company as leadCompany,
          conversations.created_at as createdAt,
          conversations.updated_at as updatedAt,
          (
            SELECT COUNT(*)
            FROM messages
            WHERE messages.conversation_id = conversations.id
          ) as messageCount
        FROM conversations
        INNER JOIN companies ON companies.id = conversations.company_id
        WHERE conversations.public_id = ?
      `
    )
    .get(publicId) as ConversationRecord | undefined;
}

function getMessagesForConversation(conversationId: number) {
  return getDb()
    .prepare(
      `
        SELECT
          id,
          public_id as publicId,
          role,
          content,
          created_at as createdAt
        FROM messages
        WHERE conversation_id = ?
        ORDER BY id ASC
      `
    )
    .all(conversationId) as MessageRecord[];
}

function listConversationRows(whereClause?: string, value?: number) {
  const query = `
    SELECT
      conversations.id,
      conversations.public_id as publicId,
      conversations.company_id as companyId,
      companies.slug as companySlug,
      companies.name as companyName,
      conversations.visitor_id as visitorId,
      conversations.source_url as sourceUrl,
      conversations.lead_name as leadName,
      conversations.lead_email as leadEmail,
      conversations.lead_company as leadCompany,
      conversations.created_at as createdAt,
      conversations.updated_at as updatedAt,
      COUNT(messages.id) as messageCount
    FROM conversations
    INNER JOIN companies ON companies.id = conversations.company_id
    LEFT JOIN messages ON messages.conversation_id = conversations.id
    ${whereClause ? `WHERE ${whereClause}` : ""}
    GROUP BY conversations.id
    ORDER BY conversations.updated_at DESC
  `;

  const rows = value === undefined
    ? getDb().prepare(query).all()
    : getDb().prepare(query).all(value);

  return rows as ConversationRecord[];
}

export function listConversations() {
  return listConversationRows().map((conversation) => ({
    ...conversation,
    messages: getMessagesForConversation(conversation.id),
  }));
}

export function listConversationsByCompany(companyId: number) {
  return listConversationRows("conversations.company_id = ?", companyId).map(
    (conversation) => ({
      ...conversation,
      messages: getMessagesForConversation(conversation.id),
    })
  );
}

export function listKnowledgeEntriesByCompany(companyId: number) {
  return getDb()
    .prepare(
      `
        SELECT
          id,
          company_id as companyId,
          kind,
          title,
          content,
          created_at as createdAt
        FROM knowledge_entries
        WHERE company_id = ?
        ORDER BY id DESC
      `
    )
    .all(companyId) as KnowledgeEntryRecord[];
}

export function getKnowledgeModelByCompany(companyId: number) {
  return getDb()
    .prepare(
      `
        SELECT
          company_id as companyId,
          source_count as sourceCount,
          chunk_count as chunkCount,
          trained_at as trainedAt
        FROM knowledge_models
        WHERE company_id = ?
      `
    )
    .get(companyId) as KnowledgeModelRecord | undefined;
}

export function listKnowledgeChunksByCompany(companyId: number) {
  return getDb()
    .prepare(
      `
        SELECT
          id,
          knowledge_entry_id as knowledgeEntryId,
          company_id as companyId,
          kind,
          title,
          content,
          chunk_index as chunkIndex,
          vector_json as vectorJson,
          created_at as createdAt
        FROM knowledge_chunks
        WHERE company_id = ?
        ORDER BY id ASC
      `
    )
    .all(companyId) as KnowledgeChunkRecord[];
}

export function addKnowledgeEntry(input: {
  companyId: number;
  kind: "document" | "website" | "history" | "pdf" | "word";
  title: string;
  content: string;
}) {
  const db = getDb();
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `
        INSERT INTO knowledge_entries (company_id, kind, title, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `
    )
    .run(
      input.companyId,
      input.kind,
      input.title.trim(),
      input.content.trim(),
      createdAt
    );
  const entry = db
    .prepare(
      `
        SELECT
          id,
          company_id as companyId,
          kind,
          title,
          content,
          created_at as createdAt
        FROM knowledge_entries
        WHERE id = ?
      `
    )
    .get(result.lastInsertRowid) as KnowledgeEntryRecord | undefined;

  if (!entry) {
    throw new Error("Unable to create knowledge entry.");
  }

  indexKnowledgeEntry(entry, db);

  return entry;
}

export function findRelevantKnowledgeEntry(companyId: number, message: string) {
  const normalizedMessage = message.toLowerCase();
  const entries = listKnowledgeEntriesByCompany(companyId);

  return (
    entries.find((entry) => {
      const haystack = `${entry.title} ${entry.content}`.toLowerCase();
      return normalizedMessage
        .split(/\s+/)
        .filter((token) => token.length >= 4)
        .some((token) => haystack.includes(token));
    }) || entries[0]
  );
}

export function retrieveRelevantKnowledgeChunks(companyId: number, message: string, limit = 4) {
  const queryVector = buildSparseVector(message);
  const queryTokens = tokenizeForRetrieval(message);
  const chunks = listKnowledgeChunksByCompany(companyId);
  const seen = new Set<string>();

  return chunks
    .map((chunk) => ({
      ...chunk,
      score:
        cosineSimilarity(queryVector, deserializeVector(chunk.vectorJson)) +
        queryTokens.reduce((bonus, token) => {
          const content = chunk.content.toLowerCase();
          return tokenMatchesText(token, content) ? bonus + 0.08 : bonus;
        }, 0),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score)
    .filter((chunk) => {
      const key = `${chunk.title.toLowerCase()}::${chunk.content.toLowerCase()}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, limit) as KnowledgeChunkMatch[];
}

function slugifyCompanyName(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function createUniqueCompanySlug(baseName: string) {
  const baseSlug = slugifyCompanyName(baseName) || "company";
  let attempt = baseSlug;
  let counter = 2;

  while (getCompanyBySlug(attempt)) {
    attempt = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return attempt;
}

function createTemporaryPassword() {
  return `Chat${randomBytes(4).toString("hex")}!`;
}

export function createPurchaseOrder(input: {
  planId: string;
  billingLabel: string;
  companyName: string;
  contactName: string;
  adminEmail: string;
  websiteUrl: string;
  iconColor: string;
  cardNumber: string;
}) {
  const existingUser = findUserByEmail(input.adminEmail.trim().toLowerCase());

  if (existingUser && getPurchaseMode() === "production") {
    throw new Error("An account with this email already exists.");
  }

  const db = getDb();
  const now = new Date().toISOString();
  const companySlug = createUniqueCompanySlug(input.companyName);
  const botId = `${companySlug}-bot`;

  db.prepare(
    `
      INSERT INTO companies (slug, name, bot_id, created_at)
      VALUES (?, ?, ?, ?)
    `
  ).run(companySlug, input.companyName.trim(), botId, now);

  const company = getCompanyBySlug(companySlug);

  if (!company) {
    throw new Error("Unable to create company.");
  }

  const allowedDomain = extractDomain(input.websiteUrl);
  if (allowedDomain) {
    db.prepare("UPDATE companies SET allowed_domain = ? WHERE id = ?").run(allowedDomain, company.id);
  }

  const installToken = generateInstallToken();
  db.prepare("UPDATE companies SET install_token = ? WHERE id = ?").run(installToken, company.id);

  const tempPassword = createTemporaryPassword();
  const normalizedEmail = input.adminEmail.trim().toLowerCase();
  const passwordHash = createPasswordHash(tempPassword);

  if (existingUser) {
    db.prepare(
      `
        UPDATE users
        SET company_id = ?,
            name = ?,
            role = ?,
            password_hash = ?
        WHERE id = ?
      `
    ).run(
      company.id,
      input.contactName.trim(),
      "client_admin",
      passwordHash,
      existingUser.id
    );
  } else {
    db.prepare(
      `
        INSERT INTO users (company_id, email, name, role, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    ).run(
      company.id,
      normalizedEmail,
      input.contactName.trim(),
      "client_admin",
      passwordHash,
      now
    );
  }

  const publicId = createId("order");
  const normalizedIconColor = input.iconColor.trim() || "#5ae0d2";
  const loginUrl = `/login?company=${company.slug}`;
  const cardLast4 = input.cardNumber.replace(/\D/g, "").slice(-4);
  const scriptSnippet = `<script
  src="https://cdn.3beeez.com/widget.js"
  data-install-token="${installToken}"
  data-position="bottom-right"
  data-icon-color="${normalizedIconColor}">
</script>`;

  db.prepare(
    `
      INSERT INTO purchase_orders (
        public_id,
        company_id,
        plan_id,
        billing_label,
        contact_name,
        admin_email,
        website_url,
        icon_color,
        card_last4,
        temp_password,
        login_url,
        script_snippet,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    publicId,
    company.id,
    input.planId,
    input.billingLabel,
    input.contactName.trim(),
    normalizedEmail,
    input.websiteUrl.trim(),
    normalizedIconColor,
    cardLast4,
    tempPassword,
    loginUrl,
    scriptSnippet,
    now
  );

  return getPurchaseOrder(publicId);
}

export function getPurchaseOrder(publicId: string) {
  return getDb()
    .prepare(
      `
        SELECT
          purchase_orders.id,
          purchase_orders.public_id as publicId,
          purchase_orders.company_id as companyId,
          companies.slug as companySlug,
          companies.name as companyName,
          purchase_orders.plan_id as planId,
          purchase_orders.billing_label as billingLabel,
          purchase_orders.contact_name as contactName,
          purchase_orders.admin_email as adminEmail,
          purchase_orders.website_url as websiteUrl,
          purchase_orders.icon_color as iconColor,
          purchase_orders.card_last4 as cardLast4,
          purchase_orders.temp_password as tempPassword,
          purchase_orders.login_url as loginUrl,
          purchase_orders.script_snippet as scriptSnippet,
          purchase_orders.created_at as createdAt
        FROM purchase_orders
        INNER JOIN companies ON companies.id = purchase_orders.company_id
        WHERE purchase_orders.public_id = ?
      `
    )
    .get(publicId) as PurchaseOrderRecord | undefined;
}

export function setCompanyStatus(companyId: number, status: CompanyStatus) {
  getDb()
    .prepare("UPDATE companies SET status = ? WHERE id = ?")
    .run(status, companyId);
}

export function getCompanyByInstallToken(token: string) {
  return getDb()
    .prepare(
      "SELECT id, slug, name, bot_id as botId, allowed_domain as allowedDomain, status, install_token as installToken FROM companies WHERE install_token = ?"
    )
    .get(token) as CompanyRecord | undefined;
}

export function getRecentMessagesForConversation(
  conversationPublicId: string,
  limit = 4
): Array<{ role: "user" | "bot"; content: string }> {
  const rows = getDb()
    .prepare(
      `
        SELECT m.role, m.content
        FROM messages m
        INNER JOIN conversations c ON c.id = m.conversation_id
        WHERE c.public_id = ?
        ORDER BY m.id DESC
        LIMIT ?
      `
    )
    .all(conversationPublicId, limit) as Array<{ role: string; content: string }>;

  return rows.reverse() as Array<{ role: "user" | "bot"; content: string }>;
}
