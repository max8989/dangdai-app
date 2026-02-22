# Story 1.8: Configurable LLM Provider with Azure OpenAI Support

Status: pending

## Story

As a system administrator / developer,
I want the quiz generation backend to support multiple LLM providers (Azure OpenAI, OpenAI, custom) configurable via environment variables,
So that I can switch between providers without code changes to optimize for cost, availability, and compliance with Azure credits.

## Acceptance Criteria

1. **Given** the backend needs to instantiate an LLM client
   **When** `LLM_PROVIDER=azure_openai` is set in environment
   **Then** the system uses `AzureChatOpenAI` with Azure OpenAI endpoint and credentials

2. **Given** the backend needs to instantiate an LLM client
   **When** `LLM_PROVIDER=openai` is set in environment
   **Then** the system uses `ChatOpenAI` with OpenAI API credentials

3. **Given** Azure OpenAI is configured as the provider
   **When** required environment variables are missing (`AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT_NAME`)
   **Then** the system raises a `ValueError` with clear message indicating which variables are missing

4. **Given** OpenAI is configured as the provider
   **When** `OPENAI_API_KEY` is missing
   **Then** the system raises a `ValueError` with clear message

5. **Given** the LLM provider is changed via environment variables
   **When** the backend service is restarted
   **Then** all quiz generation and content evaluation calls use the new provider without any code changes

6. **Given** the quiz generation graph is running
   **When** it needs an LLM instance
   **Then** it calls `get_llm()` factory function and receives the correct provider-agnostic `BaseChatModel` instance

7. **Given** no `LLM_PROVIDER` environment variable is set
   **When** the backend starts
   **Then** it defaults to `azure_openai` provider

8. **Given** an unsupported `LLM_PROVIDER` value is set (e.g., `foo`)
   **When** the backend tries to instantiate an LLM
   **Then** it raises a `ValueError` with message "Unsupported LLM_PROVIDER: foo"

9. **Given** Azure OpenAI gpt-4o is the active provider
   **When** a quiz is generated (happy path, 0 retries)
   **Then** the cost is approximately $0.020 (2 LLM calls: generation + evaluator)

10. **Given** Azure OpenAI gpt-4o is the active provider
    **When** a quiz is generated with 1 retry
    **Then** the cost is approximately $0.040 (4 LLM calls: generation + evaluator + retry generation + retry evaluator)

## Tasks / Subtasks

- [ ] Task 1: Create LLM provider factory (AC: #1, #2, #3, #4, #6, #7, #8)
  - [ ] 1.1 Create `src/utils/llm_factory.py` file
  - [ ] 1.2 Implement `get_llm(temperature: float = 0.7, max_tokens: int = 2048) -> BaseChatModel` function
  - [ ] 1.3 Add Azure OpenAI provider branch (`LLM_PROVIDER=azure_openai`)
    - [ ] 1.3.1 Check required env vars: `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT_NAME`
    - [ ] 1.3.2 Raise `ValueError` if any are missing
    - [ ] 1.3.3 Instantiate `AzureChatOpenAI` with deployment name, API version, temperature, max_tokens, model
  - [ ] 1.4 Add OpenAI provider branch (`LLM_PROVIDER=openai`)
    - [ ] 1.4.1 Check required env var: `OPENAI_API_KEY`
    - [ ] 1.4.2 Raise `ValueError` if missing
    - [ ] 1.4.3 Instantiate `ChatOpenAI` with model, temperature, max_tokens
  - [ ] 1.5 Default to `azure_openai` when `LLM_PROVIDER` not set
  - [ ] 1.6 Raise `ValueError` for unsupported provider values

- [ ] Task 2: Update graph nodes to use factory (AC: #5, #6)
  - [ ] 2.1 Update `generate_quiz` node in `src/agent/nodes.py`
    - [ ] 2.1.1 Replace any direct LLM instantiation with `llm = get_llm()`
    - [ ] 2.1.2 Remove provider-specific imports from nodes.py
  - [ ] 2.2 Update `evaluate_content` node in `src/agent/nodes.py`
    - [ ] 2.2.1 Replace any direct LLM instantiation with `llm = get_llm()`
  - [ ] 2.3 Update `validate_answer` (if it uses LLM directly)
    - [ ] 2.3.1 Replace with `llm = get_llm()`
  - [ ] 2.4 Ensure all nodes only depend on `BaseChatModel` interface

- [ ] Task 3: Remove or deprecate old LLM config file (AC: #5)
  - [ ] 3.1 If `src/utils/llm.py` exists, rename or remove it
  - [ ] 3.2 Update all imports from `llm.py` to `llm_factory.py`

- [ ] Task 4: Add environment configuration (AC: #1, #2, #3, #4, #7)
  - [ ] 4.1 Update `.env.example` in `dangdai-api/`
    - [ ] 4.1.1 Add `LLM_PROVIDER=azure_openai` (default)
    - [ ] 4.1.2 Add Azure OpenAI section with all required vars
    - [ ] 4.1.3 Add OpenAI section (commented out as alternative)
    - [ ] 4.1.4 Add LLM parameters section (temperature, max_tokens, top_p)
  - [ ] 4.2 Update `README.md` with LLM provider setup instructions
    - [ ] 4.2.1 Document Azure OpenAI setup steps
    - [ ] 4.2.2 Document OpenAI setup steps
    - [ ] 4.2.3 Document how to switch providers

- [ ] Task 5: Update Terraform for Azure OpenAI (AC: #1)
  - [ ] 5.1 Create `terraform/openai.tf` file
  - [ ] 5.2 Add Azure OpenAI resource provisioning
    - [ ] 5.2.1 Resource name: `dangdai-openai`
    - [ ] 5.2.2 Region: East US (or variable)
    - [ ] 5.2.3 Pricing tier: Standard
  - [ ] 5.3 Add gpt-4o deployment
    - [ ] 5.3.1 Deployment name: `gpt-4o`
    - [ ] 5.3.2 Tokens per minute rate limit: 30K (or variable)
  - [ ] 5.4 Output Azure OpenAI endpoint and key (via Key Vault reference)
  - [ ] 5.5 Update Container Apps environment variables
    - [ ] 5.5.1 Add `LLM_PROVIDER=azure_openai`
    - [ ] 5.5.2 Add `AZURE_OPENAI_ENDPOINT` from output
    - [ ] 5.5.3 Add `AZURE_OPENAI_API_KEY` from Key Vault
    - [ ] 5.5.4 Add `AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o`
    - [ ] 5.5.5 Add `AZURE_OPENAI_MODEL=gpt-4o`

- [ ] Task 6: Add unit tests (AC: #1, #2, #3, #4, #6, #7, #8)
  - [ ] 6.1 Create `tests/test_llm_factory.py`
  - [ ] 6.2 Test Azure OpenAI provider instantiation (happy path)
    - [ ] 6.2.1 Mock environment variables for Azure OpenAI
    - [ ] 6.2.2 Assert `get_llm()` returns `AzureChatOpenAI` instance
    - [ ] 6.2.3 Verify correct deployment name, API version, model
  - [ ] 6.3 Test OpenAI provider instantiation (happy path)
    - [ ] 6.3.1 Mock environment variables for OpenAI
    - [ ] 6.3.2 Assert `get_llm()` returns `ChatOpenAI` instance
    - [ ] 6.3.3 Verify correct model name
  - [ ] 6.4 Test missing Azure OpenAI credentials
    - [ ] 6.4.1 Set `LLM_PROVIDER=azure_openai`, omit `AZURE_OPENAI_API_KEY`
    - [ ] 6.4.2 Assert `ValueError` raised with message containing "AZURE_OPENAI_API_KEY"
  - [ ] 6.5 Test missing OpenAI credentials
    - [ ] 6.5.1 Set `LLM_PROVIDER=openai`, omit `OPENAI_API_KEY`
    - [ ] 6.5.2 Assert `ValueError` raised with message containing "OPENAI_API_KEY"
  - [ ] 6.6 Test default provider (azure_openai)
    - [ ] 6.6.1 Unset `LLM_PROVIDER` env var
    - [ ] 6.6.2 Assert `get_llm()` uses Azure OpenAI
  - [ ] 6.7 Test unsupported provider
    - [ ] 6.7.1 Set `LLM_PROVIDER=unsupported_provider`
    - [ ] 6.7.2 Assert `ValueError` raised with "Unsupported LLM_PROVIDER: unsupported_provider"
  - [ ] 6.8 Test temperature and max_tokens parameters
    - [ ] 6.8.1 Call `get_llm(temperature=0.9, max_tokens=4096)`
    - [ ] 6.8.2 Assert returned LLM has correct parameters

- [ ] Task 7: Add integration tests (AC: #5, #9, #10)
  - [ ] 7.1 Test quiz generation with Azure OpenAI provider
    - [ ] 7.1.1 Set Azure OpenAI credentials in test environment
    - [ ] 7.1.2 Generate a quiz via the graph
    - [ ] 7.1.3 Assert quiz is generated successfully
    - [ ] 7.1.4 Log token usage and cost (manual verification for AC #9, #10)
  - [ ] 7.2 Test quiz generation with OpenAI provider
    - [ ] 7.2.1 Set OpenAI credentials in test environment
    - [ ] 7.2.2 Generate a quiz via the graph
    - [ ] 7.2.3 Assert quiz is generated successfully
  - [ ] 7.3 Test provider switching without code changes
    - [ ] 7.3.1 Generate quiz with Azure OpenAI
    - [ ] 7.3.2 Change `LLM_PROVIDER` to `openai`
    - [ ] 7.3.3 Generate quiz with OpenAI (no code reload, just env change)
    - [ ] 7.3.4 Assert both succeed

- [ ] Task 8: Update architecture documentation (AC: all)
  - [ ] 8.1 Verify `_bmad-output/planning-artifacts/architecture.md` includes LLM Provider Configuration section
  - [ ] 8.2 Verify environment variable schema is documented
  - [ ] 8.3 Verify cost analysis is documented (AC #9, #10)
  - [ ] 8.4 Verify Azure OpenAI setup steps are documented

- [ ] Task 9: Add monitoring and logging (AC: #5, #9, #10)
  - [ ] 9.1 Log active LLM provider on backend startup
    - [ ] 9.1.1 Log message: "Using LLM provider: {provider} with model: {model}"
  - [ ] 9.2 Log token usage per quiz generation
    - [ ] 9.2.1 Log input tokens, output tokens, total tokens
    - [ ] 9.2.2 Log estimated cost (if Azure OpenAI)
  - [ ] 9.3 Add cost tracking metric (optional, for AC #9, #10 verification)
    - [ ] 9.3.1 Track cumulative cost per day
    - [ ] 9.3.2 Alert if daily cost exceeds $10 (30% of monthly budget)

- [ ] Task 10: Code review and validation (AC: all)
  - [ ] 10.1 Verify `ruff check` passes
  - [ ] 10.2 Verify `ruff format --check` passes
  - [ ] 10.3 Verify `mypy --strict` passes
  - [ ] 10.4 Verify all tests pass (`pytest`)
  - [ ] 10.5 Manual verification: switch between Azure OpenAI and OpenAI, generate quizzes with both
  - [ ] 10.6 Manual verification: cost per quiz matches estimates (AC #9, #10)

## Review Follow-ups (Code Review)

_This section will be populated during code review._

## Dev Notes

### Current State (Read Before Coding)

**Existing LLM Integration:**
- Current implementation may have direct LLM instantiation in graph nodes
- Check `src/agent/nodes.py` for `generate_quiz` and `evaluate_content` nodes
- Check if `src/utils/llm.py` exists (may need to be replaced with `llm_factory.py`)

**Architecture Updates:**
- The architecture document (`_bmad-output/planning-artifacts/architecture.md`) has already been updated with:
  - LLM Provider Configuration Architecture section
  - Complete environment variable schema
  - Cost analysis for Azure OpenAI gpt-4o
  - Azure OpenAI deployment setup guide
  - Provider abstraction pattern with factory function code example

**Dependencies:**
- This story requires the quiz generation pipeline to be functional (Story 4.1, 4.13 completed)
- This story is a prerequisite for Azure deployment (Story 1.6 may need updates)

### Implementation Notes

**LangChain Imports:**
```python
from langchain_openai import AzureChatOpenAI, ChatOpenAI
from langchain_core.language_models import BaseChatModel
```

**Azure OpenAI API Version:**
- Use `2024-02-15-preview` or later
- Check Azure OpenAI docs for latest stable version

**Environment Variable Precedence:**
- `LLM_PROVIDER` determines which provider branch to use
- Provider-specific vars are only required when that provider is active
- This allows both sets of credentials to exist in `.env` for easy switching

**Cost Calculation (Azure OpenAI gpt-4o):**
- Input: $0.0025 per 1K tokens
- Output: $0.01 per 1K tokens
- Quiz generation (happy path): ~800 input + ~1200 output = ~$0.014
- Content evaluator (happy path): ~1400 input + ~200 output = ~$0.006
- Total (0 retries): ~$0.020
- Total (1 retry): ~$0.040
- Total (2 retries, max): ~$0.060

**Testing Strategy:**
- Unit tests mock environment variables and assert correct provider instantiation
- Integration tests use real API calls (requires test credentials)
- Manual testing required for cost verification (AC #9, #10)

### Technical Decisions

**Why Factory Pattern:**
- Centralized provider logic prevents scattered provider-specific code
- Graph nodes remain provider-agnostic
- Easy to add new providers (e.g., Azure AI Phi-4, local models) in the future

**Why Default to Azure OpenAI:**
- Project has $200/month Azure credit available
- Azure OpenAI is production deployment target
- Aligns with infrastructure (Azure Container Apps)

**Why Support OpenAI Fallback:**
- Development/testing without Azure resource
- Fallback if Azure OpenAI quota is exhausted
- Access to newer models (e.g., gpt-4.1) not yet in Azure

### References

- Architecture Document: `_bmad-output/planning-artifacts/architecture.md` (LLM Provider Configuration Architecture section)
- LangChain Azure OpenAI Docs: https://python.langchain.com/docs/integrations/llms/azure_openai
- Azure OpenAI Service Docs: https://learn.microsoft.com/en-us/azure/ai-services/openai/
- Story 4.13: Evaluator-Optimizer Quiz Content Validation (uses LLM factory)
- Story 1.6: Deploy Python Backend to Azure Container Apps (environment variables)

### Related Stories

- **Depends on:** Story 4.1 (Quiz Generation API Endpoint), Story 4.13 (Evaluator-Optimizer)
- **Blocks:** None (can be implemented independently)
- **Related:** Story 1.6 (Azure deployment will use Azure OpenAI credentials)

## Definition of Done

- [ ] All tasks completed and checked off
- [ ] All acceptance criteria verified and passing
- [ ] Unit tests written and passing (coverage ≥80% for `llm_factory.py`)
- [ ] Integration tests written and passing
- [ ] Code reviewed and approved
- [ ] `ruff check` passes with zero errors
- [ ] `ruff format --check` passes
- [ ] `mypy --strict` passes with zero errors
- [ ] Documentation updated (README.md, .env.example)
- [ ] Architecture document reflects implementation (already done)
- [ ] Manual testing completed: quiz generation works with both Azure OpenAI and OpenAI
- [ ] Cost per quiz verified to match estimates (AC #9, #10)
- [ ] Deployed to dev/staging environment and tested
- [ ] No regression in existing quiz generation functionality
