# AGENTS.md

Guidance for AI coding agents operating in this repository.

## Project Description

Dangdai App — a cross-platform web application (installable PWA) for learning Chinese through AI-generated quizzes based on the 當代中文課程 (A Course in Contemporary Chinese) textbook series. Monorepo with a Vite + React PWA, a Python FastAPI backend with LangGraph, and a RAG pipeline.

> **`dangdai-mobile/` is archived.** The React Native + Expo + Tamagui client has been superseded by `dangdai-pwa/` (Vite + React 19 + shadcn/ui + Tailwind v4 + TanStack Router). Do not add features or fixes to `dangdai-mobile/`. See `dangdai-pwa/HANDOFF.md` for the migration history.

## BMAD Framework

This project uses BMAD v6.0.0-Beta.8 for planning and development workflow. Key references:

- **Architecture**: `_bmad-output/planning-artifacts/architecture.md`
- **PRD**: `_bmad-output/planning-artifacts/prd.md`
- **Epics & Stories**: `_bmad-output/planning-artifacts/epics.md`
- **UX Spec**: `_bmad-output/planning-artifacts/ux-design-specification.md`
- **Sprint Stories**: `_bmad-output/implementation-artifacts/`
- **Agent Definitions**: `_bmad/bmm/agents/`
- **Workflows**: `_bmad/bmm/workflows/`

Consult these artifacts before making architectural decisions or implementing new features. Note that some of these documents predate the mobile→PWA migration; when they conflict with the PWA implementation, trust the code and `dangdai-pwa/HANDOFF.md`.

## MCP Tools — Always Use These

- **Context7 MCP**: Always use the Context7 MCP tool (`resolve-library-id` then `query-docs`) to look up documentation for any library or framework (React, Vite, TanStack Router, TanStack Query, shadcn/ui, Tailwind v4, Zustand, Supabase, FastAPI, LangGraph, vite-plugin-pwa, `@dnd-kit`, etc.). Do not rely on training data alone.
- **Supabase MCP**: Whenever doing anything with Supabase (schema changes, migrations, querying tables, RLS policies, checking advisors, generating types), use the Supabase MCP tools (`list_tables`, `execute_sql`, `apply_migration`, `generate_typescript_types`, `get_advisors`, etc.) instead of writing SQL manually or guessing schema.
- **Context Mode MCP**: Use `ctx_execute` / `ctx_execute_file` instead of raw Bash for any command whose output may exceed 20 lines (logs, test runs, git history, API calls, build output, dependency trees, etc.). This keeps large output out of the context window. Use the helper skills below as needed:
  - `context-mode` — core routing skill; auto-triggers on large-output commands
  - `ctx-stats` — show context savings for the current session
  - `ctx-doctor` — run diagnostics (runtimes, hooks, FTS5, versions)
  - `ctx-upgrade` — update context-mode from GitHub
  - `ctx-cloud-setup` — connect to Context Mode Cloud
  - `ctx-cloud-status` — show cloud sync health and event statistics
- **CodeGraphContext MCP**: A structural graph index of `dangdai-pwa/` and `dangdai-api/` (nodes: `Repository`, `File`, `Module`, `Class`, `Function`; edges: `CONTAINS`, `CALLS`, `IMPORTS`, `INHERITS`). Both repos share one graph, so you can trace calls across the client/API boundary. Prefer it over grep when the question is structural:
  - "who calls X?" / "what calls into endpoint Y?" / call chains and import graphs
  - inheritance, complexity hotspots, dead code, cross-module relationships
  - cross-repo traces: PWA hook → FastAPI route → service → repository
  - Tools: `find_code`, `analyze_code_relationships`, `find_dead_code`, `find_most_complex_functions`, `execute_cypher_query` (read-only Cypher fallback), `get_repository_stats`, `list_indexed_repositories`.
  - Skip it for plain text search (use `grep`) and for reading code logic (use `Read`). It does not index `node_modules/`, `.venv/`, build artifacts, or test output (see each repo's `.cgcignore`).
  - The archived `dangdai-mobile/` should not be re-indexed — drop it from the graph if it's still present (`delete_repository`).
  - Re-index after non-trivial changes: `cgc index <path>`. Or rely on `cgc watch` if a watcher is running.

## Build / Lint / Test Commands

### PWA (`dangdai-pwa/`)

Uses **npm** (not yarn). Vite 8 + React 19 + TypeScript 6 (strict, `verbatimModuleSyntax`).

```bash
# Dev server (Vite, default http://localhost:5173)
npm run dev

# Production build (tsc -b && vite build) — must be green before merging
npm run build

# Preview the production build locally
npm run preview

# Linting (ESLint flat config)
npm run lint
```

Test infrastructure has not been set up yet for the PWA (see `dangdai-pwa/HANDOFF.md` §7 — porting tests from mobile is explicitly out of scope unless requested). If you add tests, propose the runner choice (Vitest is the natural fit for Vite) before scaffolding.

### Python Backend (`dangdai-api/`)

```bash
# Dev server
uvicorn src.api.main:app --reload --port 8000

# Linting & formatting
ruff check src/ tests/                      # lint
ruff format --check src/ tests/             # format check
ruff format src/ tests/                     # auto-format
ruff check --select I --fix src/ tests/     # fix import sorting
mypy src/ --strict                          # type checking

# Tests (pytest)
make test                                   # unit tests
make test TEST_FILE=tests/test_api.py       # single test file
pytest tests/test_api.py -v --tb=short      # single file directly
pytest tests/test_api.py::TestClass::test_fn  # single test function
make integration_tests                      # integration tests
make test_watch                             # watch mode
```

### RAG Pipeline (`dangdai-rag/`)

See `dangdai-rag/CLAUDE.md` for commands and architecture details.

## Code Style

### TypeScript (PWA)

- **Strict mode** enabled across `tsconfig.app.json` / `tsconfig.node.json`. `verbatimModuleSyntax: true` (use `import type { ... }` for type-only imports), `noUnusedLocals`, `erasableSyntaxOnly`.
- **ESLint flat config** (`eslint.config.js`) extends `js.configs.recommended`, `tseslint.configs.recommended`, `eslint-plugin-react-hooks` (flat), and `eslint-plugin-react-refresh` (vite preset). Globals: `browser`. `dist/` is globally ignored.
- **No Prettier** — no Prettier config exists in this project.
- **Path alias**: `@/* → src/*` (configured in `tsconfig.json` and Vite). Prefer `@/lib/...`, `@/hooks/...`, `@/components/...` over deep relative paths.
- **Imports** — ordered: React core → third-party (`@tanstack`, `@supabase`, `lucide-react`, `sonner`, `@dnd-kit`, etc.) → local `@/`. Use `import type { ... }` for type-only imports.
- **Components**: `PascalCase` filenames and exports (`BookCard.tsx`, `LoginForm.tsx`).
- **Hooks**: `camelCase` with `use` prefix (`useAuth.ts`, `useBooks.ts`).
- **Stores**: Zustand stores use `use` prefix (`useQuizStore.ts`, `useSettingsStore.ts`).
- **Types/Interfaces**: `PascalCase` (`Book`, `Chapter`, `AuthError`).
- **Variables/Functions**: `camelCase`.
- **Constants**: `UPPER_SNAKE_CASE` exports in `camelCase` files.
- **Routes**: TanStack Router file-based convention under `src/routes/`. Pathless layouts use `_name.tsx` with children in `_name/`. Dynamic params: `$param.tsx`, read via `Route.useParams()`; search params via `Route.useSearch()`. The `routeTree.gen.ts` file is auto-generated by `@tanstack/router-plugin` — never edit it; if `npm run build` fails on stale types, run `npx vite build` once (or `npm run dev`) to regenerate it.
- **Styling**: Tailwind v4 (via `@tailwindcss/vite`) + shadcn/ui (new-york style, neutral base, CSS vars). Theme tokens live in `src/index.css` (`--background`, `--foreground`, `--primary`, etc.) — don't add competing CSS vars. Dark mode uses `@custom-variant dark (&:is(.dark *))`; the `.dark` class is applied to `<html>` by `useThemeSync` in `__root.tsx`.
- **Env vars**: use `import.meta.env.VITE_*` (e.g. `VITE_SUPABASE_URL`, `VITE_API_URL`). **Never** `process.env.*`. Use `import.meta.env.DEV` instead of `__DEV__`.

### Python (Backend)

- **Ruff** for linting and formatting. Rules: pycodestyle (E), pyflakes (F), isort (I), pydocstyle (D with Google convention), print statements (T201), pyupgrade (UP).
- **mypy --strict** for type checking.
- **Google-style docstrings** (enforced by ruff `D401`).
- **Files/Modules**: `snake_case`. **Classes**: `PascalCase`. **Functions**: `snake_case`. **Constants**: `UPPER_SNAKE_CASE`.
- **Imports**: stdlib → third-party → local. Local imports use dotted paths (`from src.api.middleware import setup_middleware`).
- **Tests**: `test_` prefix for functions, `Test` prefix for classes. Docstrings exempt in test files.

### Database (Supabase)

- **Tables/Columns**: `snake_case` (`chapter_progress`, `user_id`, `completion_percentage`).
- **API responses**: `snake_case` JSON keys.

## Error Handling Patterns

### PWA

- **Auth errors**: Typed `AuthError` with `field` discriminant (`'email' | 'password' | 'general'`). Try/catch around Supabase calls, parse error messages to set field-specific errors. Return `boolean` success. Auth forms keep a local `submitting` boolean — don't reach for `AuthProvider.loading`, which only tracks the initial `getSession()` call.
- **TanStack Query**: Global error handlers via `QueryCache.onError` and `MutationCache.onError` in `src/lib/queryClient.ts`. Queries retry once (`retry: 1`), mutations do not retry (`retry: 0`).
- **Supabase queries**: Check `error.code` for known issues (e.g., `42P01` table not found), gracefully degrade with defaults. Re-throw unknown errors for TanStack Query.
- **User-visible errors**: surface via `sonner` toast (`toast.error(...)`) — `<Toaster richColors position="top-center" />` is mounted globally in `__root.tsx`.
- **Environment vars**: Fail-fast with `throw new Error()` for required vars. `console.warn` for optional.

### Python Backend

- FastAPI exception handlers and middleware for HTTP errors.
- `NotImplementedError` for stub/unimplemented endpoints.

## Key Architecture Notes

- **State management**: Server state via TanStack Query, local state via Zustand. Never duplicate.
- **Supabase types**: Generated types live in `dangdai-pwa/src/types/supabase.ts`. Regenerate via Supabase MCP `generate_typescript_types` after schema changes.
- **Chapter IDs**: Convention is `bookId * 100 + chapterNumber` (e.g., Book 1 Chapter 5 = 105).
- **Quiz flow**: PWA → FastAPI → LangGraph → RAG (pgvector) → LLM → structured quiz response.
- **PWA install / offline**: `vite-plugin-pwa` with Workbox (`autoUpdate`) handles the manifest + service worker. Runtime caching is configured for Supabase REST and storage. Audio assets live in `public/sounds/` and are auto-precached.
- **Drag & drop**: `@dnd-kit/core` powers `sentence_construction` exercises (`PointerSensor` with `{ distance: 5 }` activation + `KeyboardSensor`). Tap-to-place is the primary interaction; drag is secondary. See `dangdai-pwa/HANDOFF.md` §0a / §5.
- **Audio**: `useSound` uses `HTMLAudioElement` with a module-level cache. Reads `useSettingsStore.getState().soundEnabled` at call time. Failures (notably `NotAllowedError` autoplay before first user gesture) are warn-logged and swallowed — quizzes must never crash on sound failure.
- **Settings persistence**: `useSettingsStore` is persisted to `localStorage[dangdai-settings]` via Zustand `persist` middleware. The quiz store (`dangdai-quiz-store`) is also persisted to `localStorage`.
- **Deployment**: PWA via GitHub Actions → Azure Static Web Apps (`.github/workflows/deploy-pwa.yml`). Backend via GitHub Actions → Azure Container Apps (Terraform, `.github/workflows/deploy-backend.yml`).
- **CI**: `.github/workflows/deploy-pwa.yml` (build + deploy on push to main, paths-filtered to `dangdai-pwa/**`), `.github/workflows/ci-backend.yml` (ruff + mypy + pytest), `.github/workflows/deploy-backend.yml` (backend deploy). There is currently **no lint/type-check CI for the PWA** — `npm run build` runs `tsc -b` so type errors fail the deploy, but a dedicated lint step would be a worthwhile addition.

## Project Structure

```
dangdai-app/
├── dangdai-pwa/         # Vite + React 19 PWA (TypeScript, shadcn/ui, Tailwind v4)
│   ├── src/
│   │   ├── routes/      # TanStack Router file-based routes
│   │   │   ├── _auth/        # Pathless auth layout + login/signup/forgot/reset
│   │   │   └── _authed/      # Pathless guarded layout (redirects unauthed → /login)
│   │   │       ├── _tabs/    # Bottom tab bar (Home / Books / Generate / Chat / Settings)
│   │   │       ├── chapter/  # Book + chapter detail screens
│   │   │       └── quiz/     # Quiz flow (selection, loading, play, premade)
│   │   ├── components/  # UI (auth/, chapter/, quiz/, ui/ for shadcn primitives)
│   │   ├── hooks/       # Custom hooks (useAuth, useBooks, useQuizGeneration, useSound, etc.)
│   │   ├── stores/      # Zustand stores (quiz, settings, user)
│   │   ├── lib/         # Supabase client, API client, query config, validation
│   │   ├── types/       # TypeScript types (including generated Supabase types)
│   │   ├── providers/   # AuthProvider
│   │   └── constants/   # Static data (books, chapters, tips)
│   ├── public/          # PWA icons, manifest assets, audio (sounds/)
│   ├── HANDOFF.md       # Migration history (phases 1–6) — read this for context
│   └── vite.config.ts   # Vite + vite-plugin-pwa + tanstackRouter plugin
├── dangdai-api/         # Python FastAPI + LangGraph backend
│   ├── src/agent/       # LangGraph graph, state, nodes, prompts
│   ├── src/api/         # FastAPI app, routes, middleware
│   ├── src/services/    # Business logic (quiz, auth, RAG)
│   ├── src/repositories/# Data access (chapter_repo, vector_store)
│   ├── src/utils/       # Config, Supabase client, LLM setup
│   └── tests/           # pytest unit + integration tests
├── dangdai-rag/         # RAG pipeline (agentic chunking, embeddings)
├── dangdai-mobile/      # ARCHIVED — React Native + Expo client (do not modify)
├── terraform/           # Azure Container Apps IaC (backend)
├── _bmad/               # BMAD framework (agents, workflows, config)
├── _bmad-output/        # Planning & implementation artifacts
├── .claude/             # Claude Code settings + skills
└── .github/workflows/   # CI / deploy (deploy-pwa, ci-backend, deploy-backend)
```
