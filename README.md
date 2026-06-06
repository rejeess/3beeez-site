# 3Beeez Site

Next.js landing page for `3beeez.com`.

## Structure

- `app/layout.tsx`: root layout and metadata
- `app/page.tsx`: homepage content
- `app/admin/page.tsx`: admin inbox for stored conversations
- `app/login/page.tsx`: owner and client login
- `app/portal/page.tsx`: authenticated client portal
- `app/purchase/page.tsx`: simple local mock checkout form
- `app/purchase-success/[orderId]/page.tsx`: generated customer handoff with login and script
- `app/test-site/[companySlug]/page.tsx`: mock client website with embedded chatbot
- `app/purchase-demo/[companySlug]/page.tsx`: mocked post-payment service activation page
- `app/checkout/route.ts`: checkout entrypoint that uses mock locally and can redirect to real payments in production
- `app/api/chat/route.ts`: backend route that stores chat messages
- `app/api/portal/knowledge/*/route.ts`: company knowledge upload routes
- `app/globals.css`: global styles and responsive layout
- `components/chat-demo.tsx`: interactive chatbot demo
- `components/admin-conversation-list.tsx`: reusable conversation list UI
- `components/login-form.tsx`: login form
- `components/logout-form.tsx`: sign-out form
- `components/purchase-form.tsx`: local purchase form for company and payment details
- `lib/auth.ts`: cookie-session auth helpers
- `lib/db.ts`: SQLite database, seeded users, companies, chats, and sessions
- `lib/email.ts`: SMTP email delivery helper for local purchase testing
- `lib/hf-embeddings.ts`: Hugging Face embedding client
- `lib/pgvector-store.ts`: Postgres + pgvector indexing and retrieval
- `lib/hosted-llm.ts`: optional OpenAI-compatible hosted LLM synthesis
- `lib/knowledge-service.ts`: knowledge storage and retrieval abstraction
- `lib/purchase.ts`: purchase plans and checkout mode helpers
- `lib/rag.ts`: chunking, retrieval formatting, and local fallback answer generation
- `data/app.db`: SQLite database created automatically at runtime

## Run locally

1. Install dependencies with `npm install`
2. Start the dev server with `npm run dev`
3. Open `http://localhost:3000`
4. Open `http://localhost:3000/login`
5. Sign in as the owner to reach `/admin`
6. Sign in as a client admin to reach `/portal`
7. Open `http://localhost:3000/test-site/acme-support` for the sample client website
8. Open `http://localhost:3000/purchase-demo/acme-support` for the mocked post-payment handoff
9. Open `http://localhost:3000/purchase?plan=monthly` to run the simple local purchase flow

## Real email testing in local

Set these env vars before starting the app if you want the mock purchase flow to send a real email:

- `APP_BASE_URL=http://127.0.0.1:3000`
- `SMTP_HOST=your-smtp-host`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=your-smtp-user`
- `SMTP_PASS=your-smtp-password`
- `SMTP_FROM=hello@yourdomain.com`

If SMTP is configured, the purchase flow sends the generated login details and script to the email entered in the form.

## Production RAG setup

The app now supports a production-style retrieval pipeline:

1. Client uploads website URLs, PDFs, DOCX files, or support notes.
2. The text is cleaned and chunked.
3. Chunks are embedded with Hugging Face.
4. Embeddings are stored in Postgres with `pgvector`.
5. Chat retrieves tenant-specific chunks by `company_id`.
6. If a hosted LLM is configured, the final answer is synthesized from retrieved context.
7. If not, the app falls back to the local RAG answer formatter.

Set these env vars to enable the production knowledge path:

- `DATABASE_URL=postgres://...`
- `PGVECTOR_DIMENSIONS=1024`
- `HF_API_TOKEN=your-huggingface-token`
- `HF_EMBEDDING_API_URL=https://your-hf-embedding-endpoint`
- `HF_EMBEDDING_PROMPT_MODE=e5`

Optional hosted LLM synthesis:

- `LLM_API_URL=https://your-openai-compatible-chat-endpoint`
- `LLM_API_KEY=your-llm-key`
- `LLM_MODEL=your-model-name`

Notes:

- `HF_EMBEDDING_API_URL` should point to a Hugging Face embedding endpoint that accepts JSON `inputs` and returns embeddings.
- `PGVECTOR_DIMENSIONS` must match the embedding model dimension.
- If these vars are not set, the app keeps working locally with the SQLite fallback retrieval path.

## Seeded demo accounts

- Owner: `owner@3beeez.com` / `OwnerPass!2026`
- Client: `admin@acme-support.com` / `AcmePortal!2026`

## When you are ready to go live

1. Buy hosting or use a Next.js-friendly host such as Vercel or Netlify.
2. Point `3beeez.com` to that hosting provider.
3. Deploy this folder as the app.
4. Keep auth/session storage local for development, and use hosted Postgres + `pgvector` for production knowledge retrieval.
5. Replace the seeded passwords with real user management, password reset, and email verification.
6. Set `PURCHASE_MODE=production` and `PURCHASE_PROVIDER_URL=https://your-real-checkout-url` to enable real payment redirects.
7. Configure Hugging Face embeddings plus a hosted LLM to enable the production RAG pipeline.
