# Dangdai API

Python FastAPI + LangGraph backend for quiz generation and answer validation.

## Getting Started

1. Install dependencies:

```bash
cd dangdai-api
python -m venv .venv
source .venv/bin/activate  # on Windows: .venv\Scripts\activate
pip install -e ".[dev]"
```

2. Copy the environment file and configure:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
uvicorn src.api.main:app --reload --port 8000
```

To expose the server to other devices on your local network (e.g. a physical phone):

```bash
uvicorn src.api.main:app --reload --port 8000 --host 0.0.0.0
```

Then set `EXPO_PUBLIC_API_URL=http://<your-local-ip>:8000` in `dangdai-mobile/.env.local`.

## LLM Provider Configuration

The backend supports multiple LLM providers, configurable via environment variables. No code changes are needed to switch providers.

### Azure OpenAI (Default)

Set `LLM_PROVIDER=azure_openai` (or leave unset, as this is the default).

Required environment variables:

```bash
LLM_PROVIDER=azure_openai
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview  # optional, this is the default
```

### OpenAI

Set `LLM_PROVIDER=openai`.

Required environment variables:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### Anthropic

Set `LLM_PROVIDER=anthropic`.

Required environment variables:

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### Switching Providers

1. Update `LLM_PROVIDER` in your `.env` file
2. Set the required credentials for the new provider
3. Restart the backend server
4. The startup log will confirm: `Using LLM provider: <provider> with model: <model>`

### Optional LLM Parameters

```bash
LLM_MODEL=gpt-4o          # Override default model for the provider
LLM_TEMPERATURE=0.7       # Sampling temperature (default: 0.7)
LLM_MAX_TOKENS=2048       # Max output tokens (default: 2048)
```

### Cost Estimates (Azure OpenAI gpt-4o)

| Scenario | LLM Calls | Estimated Cost |
|----------|-----------|----------------|
| Quiz generation (0 retries) | 2 (generation + evaluator) | ~$0.020 |
| Quiz generation (1 retry) | 4 | ~$0.040 |
| Quiz generation (2 retries, max) | 6 | ~$0.060 |

## Development

```bash
# Run unit tests
make test

# Run integration tests (requires real API credentials)
make integration_tests

# Lint and format
ruff check src/ tests/
ruff format --check src/ tests/

# Type checking
mypy src/ --strict
```

## Architecture

The quiz generation pipeline uses LangGraph:

```
START -> retrieve_content -> query_weakness -> generate_quiz -> validate_structure -> evaluate_content -> END
```

The LLM provider is abstracted via a factory pattern in `src/utils/llm_factory.py`. All graph nodes and services call `get_llm()` which returns a provider-agnostic `BaseChatModel` instance.

## Request Cancellation Architecture

All long-running endpoints detect and respect client disconnections to prevent resource waste and reduce LLM costs when users navigate away.

### How It Works

When a client disconnects (e.g., user presses "back" during quiz generation), the mobile app's `AbortController` cancels the HTTP request. The backend detects this via FastAPI's `Request.is_disconnected()` at key checkpoints:

1. **Before LangGraph invocation** (`quiz_service.py`) — aborts before any LLM calls
2. **Before RAG database query** (`retrieve_content` node) — avoids unnecessary DB queries
3. **Before weakness profile query** (`query_weakness` node) — avoids unnecessary DB queries
4. **Before quiz generation LLM call** (`generate_quiz` node) — saves ~$0.02-0.04 per abort
5. **Before evaluator LLM call** (`evaluate_content` node) — saves additional LLM costs
6. **Before validation LLM call** (`validation_service.py`) — for answer validation endpoint

When disconnection is detected, `asyncio.CancelledError` is raised immediately. FastAPI handles this gracefully (no 500 error logged, connection closed silently).

### Cost Savings

| Scenario | Monthly Savings |
|----------|----------------|
| 100 users × 10 quizzes/week × 10% cancellation rate | ~$14/month |
| Cancellations stopped before first LLM call | ~87% cost reduction per abort |

### Testing Cancellation Manually

```bash
# Simulate client disconnect with curl timeout (quiz generation takes ~8-60s)
curl -X POST http://localhost:8000/api/quizzes/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{"chapter_id": 105, "book_id": 1, "exercise_type": "vocabulary"}' \
  --max-time 2

# Expected backend logs:
# [QuizService] Client disconnected before graph start for chapter=105 user=...
# OR (if disconnect happens mid-graph):
# [Node:generate_quiz] Client disconnected, aborting LLM call
# [QuizService] Quiz generation cancelled by client disconnect (chapter=105 user=...)
```
