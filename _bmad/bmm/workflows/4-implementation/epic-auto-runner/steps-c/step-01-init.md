---
name: 'step-01-init'
description: 'Validate Git MCP, accept ordered story list, load sprint-status.yaml, resolve stories and epic completion tracking'

nextStepFile: './step-02-story-cycle.md'
---

# Step 1: Initialization

## STEP GOAL:

Validate prerequisites, accept an ordered list of story IDs from the user, resolve them against sprint-status.yaml, and set up epic completion tracking before handing off to the autonomous build cycle.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- ⚙️ TOOL/SUBPROCESS FALLBACK: If any instruction references a subprocess or tool you do not have access to, you MUST still achieve the outcome in your main context thread

### Role Reinforcement:

- ✅ You are an autonomous build cycle orchestrator
- ✅ You execute precisely and validate before running
- ✅ You halt ONLY for missing prerequisites or user input at this step
- ✅ After this step, you never block again

### Step-Specific Rules:

- 🎯 Validate Git MCP first - this is a hard requirement
- 🚫 FORBIDDEN to proceed if Git MCP is not installed
- 🎯 Use subprocess optimization (Pattern 3) to load sprint-status.yaml - return only stories for requested IDs
- ⚙️ If subprocess unavailable: load and parse sprint-status.yaml in main thread
- 💬 This is the only step where user interaction happens

## EXECUTION PROTOCOLS:

- 🎯 Validate Git MCP installation before anything else
- 🎯 Parse sprint-status.yaml and resolve each story ID in the user's ordered list
- 🎯 Derive involved epics and load ALL stories per epic (for completion tracking)
- 💾 Store ordered_stories, all_stories_per_epic, epic_completion_status, and error_log_path in working context
- 🚫 FORBIDDEN to load next step until all prerequisites pass and story order is confirmed

## CONTEXT BOUNDARIES:

- Available: BMM config (output_folder, user_name, etc.)
- Focus: Validation and setup only
- Limits: Do not start any build cycle work here
- Dependencies: sprint-status.yaml must exist, Git MCP must be installed

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Validate Git MCP Installation

Check that the Git MCP server is installed and available.

- Attempt a simple Git MCP operation (e.g., list tools or check git status via MCP)
- If Git MCP is available: continue to step 2
- If Git MCP is NOT available: halt with the following message and do not proceed:

```
🛑 HALT: Git MCP server is not installed.

This workflow requires the Git MCP server to commit changes at each step.

To install:
  https://github.com/modelcontextprotocol/servers/tree/main/src/git

Once installed, restart and re-run this workflow.
```

**Note on model configuration:** Agent models are configured in `opencode.json` (not in this workflow). If you want different models per agent (e.g., Sonnet for dev, Opus for complex review), configure them there before running.

### 2. Locate sprint-status.yaml

Search for `sprint-status.yaml` in `{output_folder}/implementation-artifacts/`.

- If found: proceed
- If NOT found: halt with message:

```
🛑 HALT: sprint-status.yaml not found.

Expected location: {output_folder}/implementation-artifacts/sprint-status.yaml

Please run sprint-planning first (/bmad-bmm-sprint-planning) before using epic-auto-runner.
```

### 3. Accept Ordered Story List

Display:

```
⚡ EPIC AUTO RUNNER — Story Order Mode

Ready to run the autonomous build cycle.

Provide your stories in the exact execution order, separated by commas.
Stories can span any epics. They will be processed sequentially in this order.

Example: 1.1b, 1.8, 2.4, 2.5, 1.10, 11.1, 11.2, 3.5, 11.8

Story IDs (in order):
```

Wait for user input. Parse the comma-separated list into `ordered_story_ids` array, preserving order.

### 4. Resolve Stories Against sprint-status.yaml

Launch a subprocess that:
1. Loads `sprint-status.yaml`
2. For each story ID in `ordered_story_ids`, finds the matching story entry
3. For each matched story returns: epic number, story number, story title, story file path, and current status
4. Returns the results as an ordered list matching the user's specified order

If subprocess unavailable: load and parse sprint-status.yaml directly in main thread.

**Validate results:**
- If any story ID is not found in sprint-status.yaml: display the list of missing story IDs, then require explicit user confirmation (Y to continue with found stories only, N to halt)
- If no stories are found at all: halt with error message

Store results as `ordered_stories` (ordered list of resolved story objects) in working context.

### 5. Derive Epic Completion Tracking

From `ordered_stories`, derive the set of unique epic numbers involved.

For each involved epic:
1. Load ALL stories for that epic from sprint-status.yaml (not just the user's list)
2. Check which stories are already completed (status = done/complete)
3. Calculate how many stories remain (total minus completed minus those in the user's ordered list)

Store as `all_stories_per_epic` (map of epic → full story list) and `epic_completion_status` (map of epic → {total, completed_before_run, in_run_list, retro_done: false}).

This data will be used during step-02 to detect when an epic becomes fully complete.

### 6. Set Error Log Path

Set `error_log_path` to: `{output_folder}/epic-auto-runner-errors-{current_date}.md`

Initialize the error log file with a header:

```markdown
# Epic Auto Runner - Error Log
Date: {current_date}
Stories (in order): {ordered_story_ids}
Involved Epics: {list of unique epic numbers}

## Errors

(No errors yet)
```

### 7. Confirm and Display Run Plan

Display a summary of what will be processed:

```
✅ Prerequisites validated. Ready to run.

📋 RUN PLAN (sequential execution order):

  # | Story ID | Epic | Title                          | Status
  --|----------|------|--------------------------------|-------
  1 | 1.1b     | 1    | Tamagui Theme & Animation...   | review
  2 | 1.8      | 1    | Configurable LLM Provider      | review
  ...

Epic Completion Tracking:
  Epic 1: {X} of {Y} stories will be done after this run
  Epic 11: {X} of {Y} stories will be done after this run
  ...
  → Retro will auto-trigger when all stories for an epic are complete

Error log: {error_log_path}

[C] Start autonomous build cycle
```

### 8. Present MENU OPTIONS

Display: **Select:** [C] Start

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed when user selects 'C'

#### Menu Handling Logic:

- IF C: Store ordered_stories, all_stories_per_epic, epic_completion_status, error_log_path in context, then load, read entire file, then execute {nextStepFile}
- IF Any other: help user, then redisplay menu

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Git MCP verified as installed
- sprint-status.yaml found and parsed
- Ordered story list accepted from user
- Each story resolved against sprint-status.yaml
- Epic completion tracking initialized
- Error log initialized
- Run plan displayed and confirmed

### ❌ SYSTEM FAILURE:

- Proceeding without Git MCP installed
- Proceeding without sprint-status.yaml
- Starting build cycle without user confirmation
- Not resolving stories against sprint-status.yaml
- Not initializing epic completion tracking
- Not initializing error log before handoff

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
