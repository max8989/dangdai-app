# Dangdai API

Python FastAPI + LangGraph backend for quiz generation and answer validation.

## Getting Started

1. Install dependencies:

```bash
cd dangdai-api
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
