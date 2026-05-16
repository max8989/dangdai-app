# Dangdai App

A cross-platform web application (installable PWA) for learning Chinese through interactive AI-generated quizzes, based on the 當代中文課程 (A Course in Contemporary Chinese) textbook series.

## Overview

Dangdai App helps users learn Chinese by providing:

- **Vocabulary & Grammar Quizzes**: AI-generated questions based on book chapters
- **Sentence Construction**: Drag-and-drop / tap-to-place tile builder
- **Textbook Chat (RAG)**: Q&A grounded in the source textbook content with citations
- **Progress Tracking**: Points, streaks, completion percentages per chapter and exercise type
- **Installable PWA**: Works in any modern browser, installable on mobile and desktop

## Architecture

This monorepo contains:

1. **PWA Client** (`dangdai-pwa/`): Vite + React 19 + TypeScript single-page app with offline support via Workbox
2. **AI Backend** (`dangdai-api/`): Python FastAPI + LangGraph service for quiz generation and RAG chat
3. **RAG Pipeline** (`dangdai-rag/`): Agentic chunking + embedding pipeline for the textbook content
4. **Archived Mobile** (`dangdai-mobile/`): React Native + Expo client — **archived, do not modify**. Replaced by the PWA. See `dangdai-pwa/HANDOFF.md` for the migration history.

### Tech Stack

**PWA Client:**
- Vite 8 + React 19 + TypeScript 6 (strict, `verbatimModuleSyntax`)
- Tailwind v4 via `@tailwindcss/vite` + shadcn/ui (new-york style, neutral base)
- TanStack Router (file-based, `autoCodeSplitting`) + TanStack Query
- Zustand for local state (settings + quiz, persisted to `localStorage`)
- `@supabase/supabase-js` for auth and data
- `vite-plugin-pwa` (Workbox, `autoUpdate`) for service worker + manifest
- `@dnd-kit/core` for sentence construction
- `sonner` for toasts, `lucide-react` for icons, `next-themes` (sonner dep)

**Backend:**
- Python 3.11+ with FastAPI
- LangGraph for AI quiz generation workflows
- LangChain for LLM integration
- Supabase pgvector for RAG retrieval
- Azure Container Apps for hosting (Terraform-managed)

## Getting Started

### Prerequisites

- Node.js 20+ and npm (the PWA uses npm, not yarn)
- Python 3.11+
- Supabase account
- LLM API key (OpenAI, Anthropic, etc.)
- Azure account (for backend + PWA deployment)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dangdai-app
```

### 2. Set Up the PWA

```bash
cd dangdai-pwa
npm install
cp .env.example .env.local
```

Edit `.env.local` with your Supabase + API credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
```

### 3. Set Up the Python Backend

```bash
cd dangdai-api
pip install -e .
cp .env.example .env
```

Edit `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
LLM_API_KEY=your-llm-api-key
LANGSMITH_API_KEY=your-langsmith-key  # Optional
```

### 4. Set Up Supabase

1. Create a new Supabase project
2. Apply the migrations in `supabase/` to provision:
   - `users` — profiles and cached aggregates
   - `quiz_attempts` — individual quiz records
   - `chapter_progress` — per-chapter completion tracking
   - `daily_activity` — streak tracking
   - Plus RAG tables (chapters, vocabulary, grammar_points, dialogues, embeddings)
3. Enable the `pgvector` extension
4. Run `dangdai-rag/` to populate the vector store with textbook embeddings

Prefer the Supabase MCP tools (`apply_migration`, `list_tables`, `generate_typescript_types`) over hand-written SQL.

### 5. Run the Development Servers

**Terminal 1 — PWA:**

```bash
cd dangdai-pwa
npm run dev
```

Vite serves at `http://localhost:5173`.

**Terminal 2 — Backend:**

```bash
cd dangdai-api
uvicorn src.api.main:app --reload --port 8000
```

API at `http://localhost:8000`.

## Project Structure

```
dangdai-app/
├── dangdai-pwa/             # PWA client (active)
│   ├── src/
│   │   ├── routes/          # TanStack Router file-based routes
│   │   │   ├── _auth/       # Login / signup / forgot / reset
│   │   │   └── _authed/     # Guarded layout
│   │   │       ├── _tabs/   # Home / Books / Generate / Chat / Settings
│   │   │       ├── chapter/ # Book + chapter detail
│   │   │       └── quiz/    # Quiz flow
│   │   ├── components/      # auth/, chapter/, quiz/, ui/ (shadcn)
│   │   ├── hooks/           # TanStack Query hooks, useSound, etc.
│   │   ├── stores/          # Zustand (quiz, settings, user)
│   │   ├── lib/             # Supabase, API client, validation
│   │   ├── types/           # TS types (incl. generated Supabase types)
│   │   ├── providers/       # AuthProvider
│   │   └── constants/       # Books, chapters, tips
│   ├── public/              # Icons, manifest, audio (sounds/)
│   ├── HANDOFF.md           # Migration history — read for context
│   └── vite.config.ts
│
├── dangdai-api/             # Python FastAPI + LangGraph backend
│   └── src/
│       ├── agent/           # LangGraph quiz generation
│       ├── api/             # FastAPI routes
│       ├── services/        # Business logic
│       ├── repositories/    # Data access
│       └── utils/           # Config, Supabase client
│
├── dangdai-rag/             # RAG pipeline (chunking, embeddings)
├── dangdai-mobile/          # ARCHIVED — React Native + Expo (do not modify)
├── terraform/               # Azure Container Apps IaC
└── .github/workflows/       # CI / deploy
```

## Development Workflow

### PWA

```bash
cd dangdai-pwa
npm run dev      # dev server
npm run build    # tsc -b && vite build (must be green to deploy)
npm run preview  # serve the built bundle
npm run lint     # ESLint flat config
```

No unit test runner is set up yet. If you add one, Vitest is the natural fit.

### Backend

```bash
cd dangdai-api
uvicorn src.api.main:app --reload   # dev
make test                            # pytest unit tests
make integration_tests               # integration tests
ruff check src/ tests/               # lint
ruff format src/ tests/              # format
mypy src/ --strict                   # type check
```

## Key Features

### Authentication

- Email / password sign-up and login via Supabase Auth
- Password reset flow with email confirmation deep link
- Session persists to `localStorage`; sign-out navigates to `/login`

### Quiz Generation

1. User picks a chapter (or a multi-chapter range via the Generate tab) and an exercise type
2. PWA calls the FastAPI backend
3. Backend uses RAG (pgvector) to retrieve relevant textbook content
4. LangGraph + LLM generate structured quiz questions
5. PWA renders the question by type (vocabulary, grammar, fill-in-blank, dialogue, sentence construction, reading comprehension, text input)
6. Results are scored locally and saved to Supabase on completion

### Textbook Chat (RAG)

Stateless Q&A grounded in textbook content, with filterable scope (book / lesson / textbook-or-workbook) and source citations.

### Progress & Gamification

- Per-quiz scores in `quiz_attempts`
- Chapter completion in `chapter_progress`
- Exercise-type-specific mastery levels
- Points + streaks cached on `users`
- Daily activity tracking

## Deployment

### PWA

Deployed to **Azure Static Web Apps** via GitHub Actions on push to `main` (`.github/workflows/deploy-pwa.yml`, paths-filtered to `dangdai-pwa/**`).

```bash
# Local production build
cd dangdai-pwa
npm run build
# dist/ → upload to any static host
```

### Backend

Deployed to **Azure Container Apps** via Terraform (`.github/workflows/deploy-backend.yml`):

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

Configured with auto-scaling (0–10 instances) and scale-to-zero for cost.

## Environment Variables

### PWA (`.env.local`)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_API_URL` | FastAPI backend URL |

Use `import.meta.env.VITE_*` in source — never `process.env.*`.

### Backend (`.env`)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `LLM_API_KEY` | API key for LLM provider |
| `LANGSMITH_API_KEY` | Optional — LangSmith observability |

## Architecture Decisions

See:

- **Architecture**: `_bmad-output/planning-artifacts/architecture.md`
- **PRD**: `_bmad-output/planning-artifacts/prd.md`
- **UX Spec**: `_bmad-output/planning-artifacts/ux-design-specification.md`
- **PWA migration history**: `dangdai-pwa/HANDOFF.md`
- **Agent guidance**: `AGENTS.md`

Some BMAD planning docs predate the mobile→PWA migration; when they conflict with the PWA implementation, trust the code and `HANDOFF.md`.

### Key Patterns

**Naming Conventions:**
- Database: `snake_case` (tables, columns)
- TypeScript: `PascalCase` components, `camelCase` functions
- API: REST endpoints with `snake_case` JSON

**State Management:**
- Server state: TanStack Query (caching, sync, invalidation)
- Local state: Zustand (quiz state, UI prefs — persisted to `localStorage`)

**Error Handling:**
- Queries retry once, mutations don't retry
- User-facing errors via `sonner` toast
- Auth errors typed with a `field` discriminant for inline form messages

## Performance Targets

- Quiz generation: < 5 seconds
- Initial load: < 3 seconds (cached SW)
- Navigation: < 500ms
- Concurrent users: 100 (MVP target)

## Contributing

1. Work in `dangdai-pwa/` (and `dangdai-api/` / `dangdai-rag/` as needed). **Do not modify `dangdai-mobile/`.**
2. Follow the conventions documented in `AGENTS.md`.
3. Use the path alias `@/...` in PWA source.
4. Ensure `npm run build` is green before opening a PR.
5. Prefer Context7 MCP for library docs and Supabase MCP for any database work.

## License

[Your License Here]
