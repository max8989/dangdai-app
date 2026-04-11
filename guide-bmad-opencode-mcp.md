# Guide: Building Software with AI — BMAD + OpenCode + MCP

A practical guide for developers who want to use AI assistants effectively to build real software, not just snippets.

---

## What Is This Stack?

| Tool | Role |
|------|------|
| **OpenCode** | The AI coding assistant (terminal-based, powered by Claude) |
| **BMAD** | A structured agent framework that gives the AI specialist roles and workflows |
| **MCP (Model Context Protocol)** | Plugins that give the AI real capabilities (read databases, search docs, control browser, etc.) |

Without BMAD, you're asking a single generic AI to do everything. With BMAD, you activate specialist agents (PM, Architect, Developer, QA, etc.) each with focused expertise and structured workflows. Without MCPs, the AI can only see what you paste into the chat. With MCPs, it can read your actual live database schema, fetch up-to-date library documentation, and inspect your browser.

---

## Prerequisites

- Node.js / npm (or Bun — faster, recommended)
- A terminal you're comfortable in
- An Anthropic API key (or access via OpenCode's auth)
- Git (your project should be a git repo)

---

## Step 1 — Install OpenCode

```bash
npm install -g opencode-ai
# or with Bun (faster)
bun install -g opencode-ai
```

Run it in your project folder:

```bash
cd my-project
opencode
```

OpenCode is a terminal-based AI assistant. It understands your codebase, can read and edit files, run commands, and use MCP tools.

---

## Step 2 — Configure MCPs

MCPs are plugins that extend what OpenCode can do. Create a config file at the root of your home config or project:

**`~/.opencode/opencode.json`** (global, applies to all projects)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "{env:CONTEXT7_API_KEY}"
      },
      "enabled": true
    },
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp",
      "headers": {
        "Authorization": "Bearer {env:SUPABASE_ACCESS_TOKEN}"
      },
      "enabled": true
    },
    "github": {
      "type": "local",
      "command": ["github-mcp-server", "stdio"],
      "enabled": true
    },
    "git": {
      "type": "local",
      "command": ["uvx", "mcp-server-git"],
      "enabled": true
    },
    "chrome-devtools": {
      "type": "local",
      "command": ["npx", "-y", "chrome-devtools-mcp@latest"]
    },
    "context-mode": {
      "type": "local",
      "command": ["context-mode"]
    }
  }
}
```

### Key MCPs Explained

**Context7** — Fetches live, up-to-date documentation for any library.
> Without it: AI uses training data that may be months or years out of date.
> With it: Ask "how does X work in React 19?" and get the actual current docs.

**Supabase** — Direct access to your Supabase project (tables, schema, migrations, RLS policies, logs).
> Without it: You describe your schema to the AI and hope it understands.
> With it: AI reads your actual schema, generates accurate migrations, checks for security advisors.

**GitHub** — Read/write GitHub issues, PRs, comments, branches.
> Useful for: Creating issues, reviewing PRs, checking CI status without leaving the terminal.

**Git** — Direct git operations (log, diff, status, branch history).
> Useful for: AI can see exactly what changed, not just what you tell it.

**Chrome DevTools** — Control a browser, take screenshots, inspect elements, run Lighthouse audits.
> Useful for: Debugging UI bugs, checking network requests, running accessibility audits.

**Context Mode** — Protects your context window from flooding with large command outputs.
> Without it: Running `npm test` dumps 300 lines into context, wasting your token budget.
> With it: Output is processed in a sandbox, only a smart summary enters context.

---

## Step 3 — Install BMAD

BMAD is installed into your project. It provides structured agents and workflows.

```bash
# Visit https://bmad.app to get the installer command
# It typically looks like:
npx bmad-init
```

This creates a `_bmad/` folder in your project with:

```
_bmad/
├── bmm/
│   ├── config.yaml          ← Your personal settings
│   ├── agents/              ← Specialist AI personas
│   │   ├── pm.md            ← Product Manager (John)
│   │   ├── architect.md     ← Architect (Winston)
│   │   ├── dev.md           ← Developer (Amelia)
│   │   ├── analyst.md       ← Analyst
│   │   ├── qa.md            ← QA Engineer
│   │   ├── sm.md            ← Scrum Master
│   │   └── ux-designer.md   ← UX Designer
│   └── workflows/           ← Step-by-step process files
│       ├── 1-analysis/      ← Research & product brief
│       ├── 2-plan-workflows/ ← PRD creation
│       ├── 3-solutioning/   ← Architecture & epics
│       └── 4-implementation/ ← Story execution & reviews
```

### Edit `_bmad/bmm/config.yaml`

```yaml
user_name: YourName
communication_language: English
output_folder: "{project-root}/_bmad-output"
```

This is how agents know your name and how to communicate with you.

---

## Step 4 — How to Invoke an Agent

Agents are activated by telling OpenCode to load a specific agent file. The cleanest way is to create a `workflow.md` file in your project root with these contents:

```markdown
You must fully embody this agent's persona and follow all activation instructions exactly as specified. NEVER break character until given an exit command.

<agent-activation CRITICAL="TRUE">
1. LOAD the FULL agent file from {project-root}/_bmad/bmm/agents/architect.md
2. READ its entire contents
3. FOLLOW every step in the activation section precisely
4. DISPLAY the welcome/greeting as instructed
5. PRESENT the numbered menu
6. WAIT for user input before proceeding
</agent-activation>
```

Then in OpenCode, type:

```
Follow the instructions in ./workflow.md.
```

The AI will load the agent file, read the config, greet you with your name, and present its menu. Change `architect.md` to `pm.md`, `dev.md`, `qa.md`, etc. to activate different agents.

---

## The BMAD Workflow — How It All Fits Together

BMAD structures software building into 4 phases. Each phase has a dedicated agent and workflow.

```
Phase 1: Analysis         → Analyst Agent
Phase 2: Planning         → PM Agent (Product Manager)
Phase 3: Solutioning      → Architect Agent
Phase 4: Implementation   → Dev Agent + SM Agent + QA Agent
```

### Phase 1 — Analysis (Understand the Problem)

**Agent:** Analyst  
**Output:** Product Brief

The analyst helps you articulate what you're building, who it's for, and why. It conducts a structured interview with you before writing anything down.

Invoke: `_bmad/bmm/agents/analyst.md`

Menu option: **[CP] Create Product Brief**

The output lands in `_bmad-output/planning-artifacts/product-brief.md`.

---

### Phase 2 — Planning (Define What to Build)

**Agent:** PM (Product Manager — John)  
**Output:** PRD (Product Requirements Document), UX Design Spec

The PM takes the product brief and, through a series of questions, produces a detailed PRD. This defines features, user stories, acceptance criteria, and constraints — without any code.

Invoke: `_bmad/bmm/agents/pm.md`

Menu options:
- **[CP] Create PRD** — Build the PRD from scratch
- **[VP] Validate PRD** — Check it is complete and coherent
- **[EP] Edit PRD** — Refine it

Output: `_bmad-output/planning-artifacts/prd.md`

Then run the UX Designer for screen flows and UI patterns.

---

### Phase 3 — Solutioning (Decide How to Build It)

**Agent:** Architect (Winston)  
**Output:** Architecture Document, Epics & Stories List

The architect reads the PRD and designs the technical solution: tech stack, data models, API contracts, infrastructure, and key decisions. Then the epics and stories list breaks the work into sprint-sized chunks.

Invoke: `_bmad/bmm/agents/architect.md`

Menu options:
- **[CA] Create Architecture**
- **[IR] Implementation Readiness** — Verify PRD + Architecture + Stories are all aligned before writing a line of code

Outputs:
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/epics.md`

---

### Phase 4 — Implementation (Build It)

**Agent:** Dev (Amelia) + SM (Scrum Master) + QA

The Scrum Master runs sprint planning from the epics list. The Developer executes individual stories one at a time — reading the story file, implementing tasks in order, writing tests, and only marking tasks complete when tests pass.

Invoke: `_bmad/bmm/agents/dev.md`

Menu option: **[DS] Dev Story** — Executes the next story

Story files live in: `_bmad-output/implementation-artifacts/`

The developer agent is strict:
- Reads the full story before touching code
- Executes tasks in the exact order written
- Never marks a task complete without passing tests
- Records every decision in the story file

---

## Practical Tips

### Always use MCPs — don't skip them

The difference between an AI that guesses and one that knows is MCPs. When working with:
- **Any library** → Tell the AI to use Context7 to look it up
- **Your database** → Tell the AI to use the Supabase MCP to read the schema
- **Large command output** → Context Mode handles it automatically

### Keep planning artifacts up to date

The AI agents read your `prd.md`, `architecture.md`, and story files. If these drift from reality, the AI will make decisions based on stale information. Update them when requirements change.

### One story at a time

Resist the urge to ask the dev agent to implement multiple stories at once. Each story is scoped intentionally. Rushing creates bugs that compound.

### Use Implementation Readiness before coding

Before starting Phase 4, run `[IR] Implementation Readiness` with the architect or PM agent. It cross-checks that your PRD, UX spec, architecture, and stories are all consistent. Catching misalignment at this stage is free. Catching it mid-implementation is expensive.

### Use bmad-help when stuck

At any point, tell the agent:

```
Invoke the bmad-help skill — I'm not sure what to do next with [your situation]
```

The help skill analyzes your current artifacts and recommends the next step.

---

## Common Mistakes

| Mistake | What Happens | Fix |
|---------|-------------|-----|
| Skipping the planning phases | AI writes code with no grounding in requirements, diverges quickly | Start with Phase 1 even for small projects |
| Not configuring MCPs | AI hallucinates library APIs, guesses your schema | Set up Context7 and Supabase MCP at minimum |
| Asking the AI to do too much at once | Quality degrades, errors compound | One story, one agent, one task at a time |
| Ignoring the story file format | Dev agent skips steps or invents its own approach | Let the SM agent create stories using the correct template |
| Never running validation | PRD and architecture drift apart silently | Use `[IR] Implementation Readiness` before coding |

---

## Quick Reference — Agent Cheat Sheet

| Agent | File | Best For |
|-------|------|----------|
| Analyst | `agents/analyst.md` | Product brief, domain research |
| PM — John | `agents/pm.md` | PRD, epics, requirements |
| Architect — Winston | `agents/architect.md` | Architecture, tech decisions |
| Developer — Amelia | `agents/dev.md` | Story implementation, code review |
| QA | `agents/qa.md` | Test strategy, E2E tests |
| SM | `agents/sm.md` | Sprint planning, story creation |
| UX Designer | `agents/ux-designer.md` | UX spec, screen flows |

---

## Minimum Setup to Get Started Today

1. Install OpenCode: `bun install -g opencode-ai`
2. Create `~/.opencode/opencode.json` with Context7 and your preferred MCPs
3. Run `npx bmad-init` in your project
4. Edit `_bmad/bmm/config.yaml` with your name
5. Create a `workflow.md` pointing to `agents/analyst.md`
6. Open OpenCode and type: `Follow the instructions in ./workflow.md`
7. Let the analyst interview you about your idea
8. Work through the phases in order

The stack feels like extra setup upfront. It pays back within the first sprint when the AI produces consistent, well-reasoned code instead of spaghetti that needs to be thrown away.
