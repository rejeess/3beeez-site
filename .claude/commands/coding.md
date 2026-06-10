# Coding Best Practices — 3Beeez Site

Project-specific coding conventions for the 3Beeez Next.js 16 (App Router) codebase.

## Project Structure

```
app/                  Routes and page components (App Router)
  (route)/
    page.tsx          Server Component by default
    actions.ts        Server Actions for this route
components/           Shared UI components
lib/                  Business logic, DB, services — no React
  db.ts               SQLite access (DatabaseSync, synchronous API)
  auth.ts             Cookie-session auth
  rag.ts              Local knowledge retrieval
  pgvector-store.ts   Postgres/pgvector retrieval
  knowledge-service.ts  Abstraction over both stores
  knowledge-ingest.ts   Ingestion pipelines
data/                 SQLite DB file (gitignored)
```

## Server vs Client Components

- **Default to Server Components.** Add `"use client"` only when you need:
  - `useState`, `useEffect`, or other hooks
  - Browser APIs (`window`, `document`, `localStorage`)
  - Event handlers that can't be Server Actions
- Never import `server-only` modules into Client Components
- Pass data from Server → Client via props, not global state
- Keep Client Components as leaf nodes — fetch data in Server parents, pass down

## TypeScript

- Strict mode is on — no `any` unless absolutely unavoidable (document why with a comment)
- Prefer `type` over `interface` for object shapes; use `interface` only for extendable contracts
- Export types from the module that owns the data shape
- Use `satisfies` operator for config objects where you want type checking without widening
- Return types on all exported functions in `lib/` — infer in component code

## Database (SQLite)

- All DB calls go through `lib/db.ts`; never import `node:sqlite` elsewhere
- Use prepared statements via `.prepare()` — never string-interpolate SQL
- `getDb()` returns the singleton; the DB is synchronous (`DatabaseSync`)
- Transactions for multi-step writes: `db.exec('BEGIN'); ...; db.exec('COMMIT')`
- Column names in SQL → camelCase aliases in SELECT (e.g. `company_id as companyId`)

## API Routes (`app/api/`)

- Validate all inputs at the boundary — assume `body` fields can be any type
- Return `Response` objects with explicit status codes
- Auth check first in every protected route — fail fast before doing any work
- Don't return stack traces or internal error messages to the client
- Use `NextRequest` typing

## Server Actions (`actions.ts`)

- Always validate with explicit checks — Server Actions receive raw form data
- Return typed state objects, never throw (let `useActionState` handle errors)
- Mark file with `"use server"` at the top
- Name actions with the `Action` suffix (e.g. `submitPurchaseAction`)

## Error Handling

- `lib/` functions: throw typed errors or return `{ success, error }` discriminated unions
- Components/routes: catch at the boundary, return user-friendly messages
- Never expose DB errors, file paths, or internal state to HTTP responses
- Use Next.js `error.tsx` for route-level error boundaries

## Environment Variables

- Access only in Server Components, Server Actions, Route Handlers, and `lib/`
- Never pass raw env vars to Client Components — extract what the client needs
- Required vars: validate at startup (`lib/db.ts` `getDb()` is the natural init point)
- Naming: `SCREAMING_SNAKE_CASE`, grouped by service prefix (e.g. `HF_`, `LLM_`, `SMTP_`)

## Naming Conventions

- Files: `kebab-case.ts` / `kebab-case.tsx`
- Components: `PascalCase` exported function, same name as file
- Hooks: `useCamelCase`
- Server Actions: `camelCaseAction`
- DB functions: `verbNoun` (e.g. `getCompanyBySlug`, `createSession`, `deleteKnowledgeSource`)
- CSS classes: `kebab-case`, semantic names (e.g. `.portal-nav`, `.chat-bubble`)

## Performance

- Prefer `async/await` Server Components for data fetching — no `useEffect` + fetch in Server Components
- Avoid `"use client"` on layout components — it forces the entire subtree client-side
- Images: `next/image` always; set `priority` on above-the-fold images
- Dynamic imports (`next/dynamic`) for heavy Client Components not needed on first paint

## Security

- SQL: prepared statements only — no string interpolation
- Auth: check `requireOwner()` / `requireClientPortalUser()` at the top of every protected page and action
- User-uploaded content: sanitize filenames, validate MIME type, limit file size before processing
- Domain locking: `isDomainAllowed()` from `lib/db.ts` is the single source of truth — don't replicate logic
- Never log passwords, tokens, or session tokens
- CORS: the chat API intentionally allows cross-origin requests (widget use case) — don't restrict it

## Dependencies

- Add packages only when the built-in or existing solution is clearly insufficient
- Prefer Node.js built-ins (`node:crypto`, `node:sqlite`, `node:fs`) over npm equivalents
- Before adding a package: check if it's already used elsewhere in `package.json`
- Dev dependencies: types (`@types/*`), build tools only — not runtime code

## Code Style

- No comments explaining *what* the code does — name things well instead
- Comment only non-obvious *why*: workarounds, hidden constraints, subtle invariants
- No trailing `console.log` or debug statements in committed code
- Prefer early returns over nested conditionals
- One exported component or function per file (exceptions: small co-located helpers)
