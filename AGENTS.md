# AGENTS.md

Guidance for AI coding agents operating in this repository.

## Project Description

Dangdai App — a cross-platform mobile application for learning Chinese through AI-generated quizzes based on the 當代中文課程 (A Course in Contemporary Chinese) textbook series. Monorepo with a React Native/Expo mobile app, a Python FastAPI backend with LangGraph, and a RAG pipeline.

## BMAD Framework

This project uses BMAD v6.0.0-Beta.8 for planning and development workflow. Key references:

- **Architecture**: `_bmad-output/planning-artifacts/architecture.md`
- **PRD**: `_bmad-output/planning-artifacts/prd.md`
- **Epics & Stories**: `_bmad-output/planning-artifacts/epics.md`
- **UX Spec**: `_bmad-output/planning-artifacts/ux-design-specification.md`
- **Sprint Stories**: `_bmad-output/implementation-artifacts/`
- **Agent Definitions**: `_bmad/bmm/agents/`
- **Workflows**: `_bmad/bmm/workflows/`

Consult these artifacts before making architectural decisions or implementing new features.

## MCP Tools — Always Use These

- **Context7 MCP**: Always use the Context7 MCP tool (`resolve-library-id` then `query-docs`) to look up documentation for any library or framework (React Native, Expo, Tamagui, TanStack Query, Zustand, Supabase, FastAPI, LangGraph, etc.). Do not rely on training data alone.
- **Supabase MCP**: Whenever doing anything with Supabase (schema changes, migrations, querying tables, RLS policies, checking advisors, generating types), use the Supabase MCP tools (`list_tables`, `execute_sql`, `apply_migration`, `generate_typescript_types`, `get_advisors`, etc.) instead of writing SQL manually or guessing schema.

## Build / Lint / Test Commands

### Mobile App (`dangdai-mobile/`)

```bash
# Dev server
npx expo start -c

# Type checking
npx tsc

# Linting
npx eslint . --ext .ts,.tsx

# Unit tests (Jest)
npx jest                                    # all unit tests
npx jest --watch                            # watch mode
npx jest --coverage                         # with coverage
npx jest path/to/Component.test.tsx         # single test file
npx jest -t "test name pattern"             # single test by name

# E2E tests (Playwright)
npx playwright test                         # all E2E tests
npx playwright test tests/login.test.ts     # single E2E test
```

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

### TypeScript (Mobile App)

- **Strict mode** enabled (`tsconfig.json`). `strictNullChecks: true`, but `noImplicitAny: false`.
- **ESLint flat config** (`eslint.config.mjs`). `no-unused-vars` is warn-level with `_` prefix ignored. `no-explicit-any` is warn-level.
- **No Prettier** — no Prettier config exists in this project.
- **Imports** — ordered: React/RN core → Expo modules → third-party (`@tamagui`, `@tanstack`, `@supabase`) → local relative (`../lib/`, `../stores/`). Use `import type { ... }` for type-only imports. No path aliases; use relative paths.
- **Components**: `PascalCase` filenames and exports (`BookCard.tsx`, `LoginForm.tsx`).
- **Hooks**: `camelCase` with `use` prefix (`useAuth.ts`, `useBooks.ts`).
- **Stores**: Zustand stores use `use` prefix (`useQuizStore.ts`, `useSettingsStore.ts`).
- **Types/Interfaces**: `PascalCase` (`Book`, `Chapter`, `AuthError`).
- **Variables/Functions**: `camelCase`.
- **Constants**: `UPPER_SNAKE_CASE` exports in `camelCase` files.
- **Tests**: Co-located with source as `*.test.ts` / `*.test.tsx`.
- **Routes**: Expo Router file conventions (`[bookId].tsx`, `(tabs)/`, `(auth)/`).

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

### Mobile App

- **Auth errors**: Typed `AuthError` with `field` discriminant (`'email' | 'password' | 'general'`). Try/catch around Supabase calls, parse error messages to set field-specific errors. Return `boolean` success.
- **TanStack Query**: Global error handlers via `QueryCache.onError` and `MutationCache.onError`. Queries retry once (`retry: 1`), mutations do not retry (`retry: 0`).
- **Supabase queries**: Check `error.code` for known issues (e.g., `42P01` table not found), gracefully degrade with defaults. Re-throw unknown errors for TanStack Query.
- **Environment vars**: Fail-fast with `throw new Error()` for required vars. `console.warn` for optional.

### Python Backend

- FastAPI exception handlers and middleware for HTTP errors.
- `NotImplementedError` for stub/unimplemented endpoints.

## Key Architecture Notes

- **State management**: Server state via TanStack Query, local state via Zustand. Never duplicate.
- **Supabase types**: Generated types live in `dangdai-mobile/types/supabase.ts`. Regenerate via Supabase MCP `generate_typescript_types` after schema changes.
- **Chapter IDs**: Convention is `bookId * 100 + chapterNumber` (e.g., Book 1 Chapter 5 = 105).
- **Quiz flow**: Mobile → FastAPI → LangGraph → RAG (pgvector) → LLM → structured quiz response.
- **Deployment**: Mobile via EAS Build, backend via GitHub Actions → Azure Container Apps (Terraform).
- **CI**: `.github/workflows/ci-mobile.yml` (lint + type-check + test), `.github/workflows/ci-backend.yml` (ruff + mypy + pytest).

## Project Structure

```
dangdai-app/
├── dangdai-mobile/      # React Native + Expo app (TypeScript)
│   ├── app/             # Expo Router screens ((auth)/, (tabs)/, quiz/, chapter/)
│   ├── components/      # UI components (auth/, chapter/)
│   ├── hooks/           # Custom hooks (useAuth, useBooks, useChapters, etc.)
│   ├── stores/          # Zustand stores (quiz, settings, user)
│   ├── lib/             # Supabase client, API client, query config
│   ├── types/           # TypeScript types (including generated Supabase types)
│   ├── providers/       # AuthProvider
│   ├── constants/       # Static data (books, chapters)
│   └── tests/           # Playwright E2E tests
├── dangdai-api/         # Python FastAPI + LangGraph backend
│   ├── src/agent/       # LangGraph graph, state, nodes, prompts
│   ├── src/api/         # FastAPI app, routes, middleware
│   ├── src/services/    # Business logic (quiz, auth, RAG)
│   ├── src/repositories/# Data access (chapter_repo, vector_store)
│   ├── src/utils/       # Config, Supabase client, LLM setup
│   └── tests/           # pytest unit + integration tests
├── dangdai-rag/         # RAG pipeline (agentic chunking, embeddings)
├── terraform/           # Azure Container Apps IaC
├── _bmad/               # BMAD framework (agents, workflows, config)
├── _bmad-output/        # Planning & implementation artifacts
├── .claude/commands/    # Claude Code BMAD commands
└── .opencode/           # OpenCode IDE agents + commands
```
