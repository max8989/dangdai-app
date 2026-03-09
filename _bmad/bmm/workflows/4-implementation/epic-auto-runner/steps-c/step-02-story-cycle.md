---
name: 'step-02-story-cycle'
description: 'Run the full story build cycle for every story in the ordered list — create-story, dev-story, code-review, with inline epic retro when an epic completes'

nextStepFile: './step-03-epic-wrap.md'
---

# Step 2: Story Cycle

## STEP GOAL:

For every story in the user's ordered list, run the full story build cycle autonomously: check/create story → dev-story → code-review, committing after each step and logging any errors. After each story completes, check if that story's epic is now fully done — if so, run the retrospective immediately before continuing.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step, ensure entire file is read
- ⚙️ TOOL/SUBPROCESS FALLBACK: If any instruction references a subprocess or tool you do not have access to, you MUST still achieve the outcome in your main context thread

### Role Reinforcement:

- ✅ You are an autonomous build cycle orchestrator
- ✅ You execute precisely, log failures, and never block
- ✅ A failed story step is logged and skipped — never a reason to stop
- ✅ You commit after every successful step using Git MCP

### Step-Specific Rules:

- 🎯 Process stories sequentially in the user-specified order — ONE at a time, NO parallel
- 🚫 NEVER wait for human input during this step
- 🚫 NEVER skip a story without logging the reason
- 🎯 Each sub-agent gets a fresh context with only what it needs
- 💾 Use Git MCP for all commits — log error and continue if commit fails
- ⚙️ If sub-agent spawning unavailable: execute each workflow step in main thread sequentially
- 🎯 After each story completes, CHECK epic completion and run retro inline if epic is done

## EXECUTION PROTOCOLS:

- 🎯 Iterate ordered_stories in strict sequential order (flat list, not grouped by epic)
- 💾 Commit after each successful step via Git MCP
- 📋 Append all errors to error_log_path with full context
- 🚫 FORBIDDEN to block or halt on any error — log and continue
- 🎯 Track epic completion after each story and trigger retro inline when appropriate

## CONTEXT BOUNDARIES:

- Available: ordered_stories, all_stories_per_epic, epic_completion_status, error_log_path from step-01
- Focus: Story-level build cycle + inline epic retro detection
- Limits: Do NOT run retro for epics that are not yet fully complete
- Dependencies: step-01 must have completed successfully

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Begin Ordered Story Iteration

For each story in `ordered_stories` (in the user-specified order, index 1 to N):

  Execute the story cycle defined in steps 2-6 below.

### 2. Check Story File Existence

Check if the story file already exists on disk for this story (check the path returned from sprint-status.yaml in step-01).

- **If story file EXISTS:** Log `[INFO] Story {story_id}: file already exists, skipping create-story` and proceed directly to step 3 (dev-story)
- **If story file does NOT exist:** Proceed to create-story sub-agent below

**Create-Story Sub-Agent (only if file does not exist):**

Spawn a fresh sub-agent with this context:
```
Agent: SM (bmad-agent-bmm-sm)
Task: Run the create-story workflow for Epic {epic_number}, Story {story_number}
Workflow: /bmad-bmm-create-story
Context: sprint-status.yaml location, epic number, story number
Auto-accept: all outputs
Do not ask for confirmation
```

On success: append to error log: `[OK] create-story {story_id}: complete` then commit via Git MCP with message: `"create-story {story_id}"`
On failure: append to error log:
```
## [FAILED] create-story {story_id}
Error: {error_details}
Action: skipping dev-story and code-review for this story
```
Then skip to next story.

### 3. Dev Story Sub-Agent

Spawn a fresh sub-agent with this context:
```
Agent: DEV (bmad-agent-bmm-dev)
Task: Run the dev-story workflow for Epic {epic_number}, Story {story_number}
Workflow: /bmad-bmm-dev-story
Context: story file path for this story
Auto-accept: all outputs
Do not ask for confirmation
```

On success: append to error log: `[OK] dev-story {story_id}: complete` then commit via Git MCP with message: `"dev-story {story_id}"`
On failure: append to error log:
```
## [FAILED] dev-story {story_id}
Error: {error_details}
Action: skipping code-review for this story
```
Then skip to next story.

### 4. Code Review Sub-Agent

Spawn a fresh sub-agent with this context:
```
Agent: DEV (bmad-agent-bmm-dev)
Task: Run the code-review workflow for Epic {epic_number}, Story {story_number}
Workflow: /bmad-bmm-code-review
Context: story file path, git diff of changes committed by dev-story (run `git diff HEAD~1` to get the diff and pass it)
Auto-accept: all outputs, apply all fixes automatically
Do not ask for confirmation
```

On success: append to error log: `[OK] code-review {story_id}: complete` then commit via Git MCP with message: `"code-review {story_id}"`
On failure: append to error log:
```
## [FAILED] code-review {story_id}
Error: {error_details}
Action: logged, continuing
```
Then continue (do not block).

### 5. Story Complete — Update Epic Tracking

Log `[OK] Story {story_id}: all steps complete`.

Update `epic_completion_status` for this story's epic:
- Mark this story as completed in the tracking
- Recalculate: are ALL stories for this epic now done? (completed_before_run + successfully completed in this run = total)

### 6. Check Epic Completion — Inline Retro

**IF this story's epic is now fully complete AND `epic_completion_status[epic].retro_done` is false:**

Log `[EPIC COMPLETE] Epic {epic_number}: all stories done. Running retrospective inline...`

**Run Retrospective Sub-Agent:**

Spawn a fresh sub-agent with this context:
```
Agent: SM (bmad-agent-bmm-sm)
Task: Run the retrospective workflow for Epic {epic_number}
Workflow: /bmad-bmm-retrospective
Context: epic number, list of stories and their outcomes (successes and failures from error log)
Auto-accept: all outputs
Do not ask for confirmation
```

On success: set `epic_completion_status[epic].retro_done = true`, commit via Git MCP with message: `"retrospective epic-{epic_number}"`
On failure: append to error log:
```
## [FAILED] retrospective epic-{epic_number} (inline)
Error: {error_details}
Action: logged, will retry in step-03 wrap-up
```
Do NOT set retro_done to true (step-03 will catch it).

**IF epic is NOT fully complete:** Continue to next story.

**IF retro already done for this epic:** Continue to next story.

Then proceed to the next story in `ordered_stories`.

### 7. Auto-Proceed to Epic Wrap

After all stories in `ordered_stories` are processed:

Display: **Story cycle complete for all {N} stories. Proceeding to epic wrap-up (catch-up retros if needed)...**

#### EXECUTION RULES:

- This is an auto-proceed step with no user choices — no halt required
- This is intentional: the workflow is fully autonomous after step-01
- Proceed directly to next step after all stories are processed

#### Menu Handling Logic:

- After story cycle complete, immediately load, read entire file, then execute {nextStepFile}

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All stories in ordered list processed (success or logged failure)
- Stories processed in exact user-specified order — no reordering
- Each successful step has a corresponding commit
- Epic completion checked after every story
- Retro triggered inline when epic fully completes
- All failures logged to error_log_path with context
- No blocking or waiting for human input
- Proceeds autonomously to step-03

### ❌ SYSTEM FAILURE:

- Blocking on any error instead of logging and continuing
- Waiting for human confirmation at any point
- Skipping a story without logging the reason
- Processing stories in parallel instead of sequentially
- Reordering stories from the user-specified order
- Not checking epic completion after each story
- Not running retro when an epic is fully complete

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
