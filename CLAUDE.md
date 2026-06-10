# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server at http://localhost:3000
npm run build     # production build
npm start         # run production build
```

No test suite or linter is configured.

## Architecture

This is a Next.js 16 (App Router) SaaS landing site for **3Beeez** — a white-label AI chat widget service that businesses embed on their websites. Customers buy a plan, get a `<script>` tag, and the embedded widget answers visitor questions using the company's own uploaded knowledge.

### Multi-tenant model

Every chatbot is scoped to a **company** record. Companies are identified by `slug` (URL-friendly) and `botId` (used by the widget script). Two user roles exist: `owner` (3Beeez internal) and `client_admin` (the paying customer). Auth is cookie-session based — see `lib/auth.ts`.

### Dual-storage knowledge retrieval

The app has two parallel retrieval paths that auto-select based on environment:

1. **Local (default)** — SQLite via Node's built-in `node:sqlite` (`DatabaseSync`). Knowledge is chunked, sparse-vectorized (bag-of-words TF), and stored in `knowledge_chunks` with cosine similarity scoring. `lib/rag.ts` contains the chunker, vectorizer, and grounded-answer generator.

2. **Production** — Postgres + pgvector (`lib/pgvector-store.ts`). Chunks are embedded via Hugging Face Inference API (`lib/hf-embeddings.ts`) and stored as dense vectors for ANN search. Activated when `DATABASE_URL` + `HF_API_TOKEN` + `HF_EMBEDDING_API_URL` are all set.

The abstraction layer is `lib/knowledge-service.ts` — `storeKnowledgeSource`, `retrieveKnowledgeForQuestion`, and `buildChatAnswer` always use this regardless of which backend is active.

### Answer synthesis pipeline

```
User message
  → retrieveKnowledgeForQuestion()   # pgvector if configured, SQLite fallback
  → buildChatAnswer()
      → synthesizeHostedAnswer()     # hosted OpenAI-compatible LLM if configured
      → generateGroundedAnswer()     # local rule-based fallback (lib/rag.ts)
```

The local fallback (`generateGroundedAnswer`) has intent classifiers for course catalogs, timings, fees, duration, placement, and location — these were tuned for a specific early client's domain and apply heuristics that may not generalize.

### Domain locking

Every company has an `allowed_domain` (e.g. `acmecorp.com`). The domain is extracted from `websiteUrl` at purchase time and stored on the `companies` row. Two enforcement points:

1. `/widget-script` — checks the `Referer` header when the script is loaded. If the domain doesn't match, returns a 403 no-op script. `localhost`/`127.0.0.1` always passes (dev).
2. `/api/chat` — checks `body.sourceUrl` against `allowedDomain`. The widget script captures `window.location.href` from the parent page and passes it through the iframe `pageUrl` param → `ChatDemo` prop → API body.

`isDomainAllowed(allowedDomain, originOrUrl)` in `lib/db.ts` is the shared utility. Empty `allowedDomain` means unrestricted (used by the seeded `3beeez` demo company). The seeded `acme-support` company has `allowed_domain = 'localhost'` for local testing.

### Key flows

**Purchase flow** (`PURCHASE_MODE` env var controls `mock` vs `production`):
- `/purchase?plan=monthly` → `PurchaseForm` → `app/purchase/actions.ts` → `createPurchaseOrder()` in `lib/db.ts`
- Creates company + `client_admin` user + temp password, optionally emails the new user (SMTP via `lib/email.ts`)
- `/purchase-success/[orderId]` shows the embed script snippet and login link
- In production mode `/checkout` redirects to `PURCHASE_PROVIDER_URL` instead

**Knowledge upload** (client portal at `/portal`):
- Website URL: `POST /api/portal/knowledge/website` → `ingestWebsiteUrl()` in `lib/knowledge-ingest.ts`
- PDF: `POST /api/portal/knowledge/pdf` → `ingestPdfFile()` (uses `/usr/bin/strings` locally; not suitable for production)
- DOCX/DOC: `POST /api/portal/knowledge/word` → `ingestWordFile()` (uses `mammoth`)
- All paths call `storeKnowledgeSource()` which indexes in both SQLite and pgvector if configured

**Chat API**: `POST /api/chat` accepts `botId` or `companySlug`, upserts a conversation, retrieves chunks, builds answer, stores messages.

**Widget delivery**: `/widget-script` serves the embeddable JavaScript; `/widget` is the iframe that the script loads.

### Database

SQLite database lives at `data/app.db` and is auto-initialized (schema + seed) on first `getDb()` call. The global `__threeBeeezDb` singleton avoids re-opening across hot reloads. Pgvector schema auto-migrates in `ensurePgvectorSchema()`.

Seeded demo accounts (local only):
- Owner: `owner@3beeez.com` / set via `SEED_OWNER_PASSWORD` in `.env.local`
- Client: `admin@acme-support.com` / set via `SEED_CLIENT_PASSWORD` in `.env.local`

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (enables pgvector path) |
| `PGVECTOR_DIMENSIONS` | Embedding dimensions, must match HF model (default 1024) |
| `HF_API_TOKEN` | Hugging Face API token |
| `HF_EMBEDDING_API_URL` | HF inference endpoint URL |
| `HF_EMBEDDING_PROMPT_MODE` | `e5` (default) prepends `query:`/`passage:` prefixes; `none` sends raw text |
| `LLM_API_URL` | OpenAI-compatible chat endpoint |
| `LLM_API_KEY` | LLM API key |
| `LLM_MODEL` | Model name |
| `PURCHASE_MODE` | `production` enables real payment redirect; default is `mock` |
| `PURCHASE_PROVIDER_URL` | Real payment provider URL (used when `PURCHASE_MODE=production`) |
| `APP_BASE_URL` | Base URL for email links (e.g., `http://127.0.0.1:3000`) |
| `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` | SMTP config for purchase confirmation emails |
