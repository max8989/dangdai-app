---
name: 'step-04-complete'
description: 'Finalize the run - display summary of successes and failures by execution order, close error log'
---

# Step 4: Completion

## STEP GOAL:

Finalize the autonomous build cycle run by writing the final summary to the error log and displaying a clear report of what succeeded and what failed, organized by the user's execution order.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 📖 CRITICAL: Read the complete step file before taking any action
- ⚙️ TOOL/SUBPROCESS FALLBACK: If any instruction references a subprocess or tool you do not have access to, you MUST still achieve the outcome in your main context thread

### Role Reinforcement:

- ✅ You are an autonomous build cycle orchestrator completing your run
- ✅ You report clearly and concisely — execution order first, then epic-level results
- ✅ This is the only step where you display results to the user

### Step-Specific Rules:

- 🎯 Read the error log and build a clear summary
- 💾 Update the error log file with a final summary section
- 📋 Display results in user's execution order, then epic-level wrap-up

## EXECUTION PROTOCOLS:

- 🎯 Load error_log_path and parse all logged entries
- 💾 Append final summary section to error log file
- 📋 Display summary to user

## CONTEXT BOUNDARIES:

- Available: ordered_stories, all_stories_per_epic, epic_completion_status, error_log_path from step-01/step-02/step-03
- Focus: Summarize and report only — no more execution
- Dependencies: step-02 and step-03 must have completed

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Parse Error Log

Load the error log file at `error_log_path` and parse all `[FAILED]`, `[OK]`, `[INFO]`, and `[EPIC COMPLETE]` entries to build a complete picture of the run.

### 2. Write Final Summary to Error Log

Append a `## Summary` section to the error log file:

```markdown
## Summary

**Run completed:** {current_datetime}
**Stories processed:** {total_count} in user-specified order
**Involved epics:** {list of epic numbers}

### Execution Order Results

| # | Story ID | Epic | create-story | dev-story | code-review |
|---|----------|------|-------------|-----------|-------------|
| 1 | 1.1b     | 1    | ⏭️ existed  | ✅ OK     | ✅ OK       |
| 2 | 1.8      | 1    | ⏭️ existed  | ✅ OK     | ❌ FAILED   |
...

### Epic-Level Results

| Epic | Automate (QA) | Retro | Retro Trigger |
|------|--------------|-------|---------------|
| 1    | ✅ OK        | ✅ OK | inline (after story #14) |
| 11   | ✅ OK        | ⏭️ skipped | not all stories complete |
| 3    | ✅ OK        | ❌ FAILED | catch-up |

### Totals
- Stories fully completed: {count}
- Stories partially completed: {count}
- Stories with failures: {count}
- Epic automate (QA) completed: {count}
- Epic retros completed: {count} (inline: {count}, catch-up: {count})
- Epic retros skipped (incomplete): {count}
```

### 3. Display Run Summary to User

Display the full summary in the terminal:

```
═══════════════════════════════════════
  EPIC AUTO RUNNER - COMPLETE
═══════════════════════════════════════

Stories: {total} processed in user-specified order
Involved Epics: {list}
Completed at: {current_datetime}

{for each story - brief status}
  #{n} {story_id}: ✅ complete / ❌ failed at {step}

Epic Wrap-Up:
{for each epic}
  Epic {n}: automate ✅/❌ | retro ✅/❌/⏭️ ({trigger})

{if any failures}
⚠️  {total_failure_count} failure(s) logged to:
    {error_log_path}

{if no failures}
✅ All steps completed successfully!

═══════════════════════════════════════
```

### 4. Done

This is the final step. The workflow is complete. No next step to load.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Error log updated with final summary
- Clear run report displayed to user in execution order
- Epic-level results shown with retro trigger info (inline vs catch-up vs skipped)
- Successes and failures clearly distinguished
- Error log path visible for user to review

### ❌ SYSTEM FAILURE:

- Not reading the error log before summarizing
- Missing or incomplete summary
- Not displaying results to user
- Displaying results grouped by epic instead of execution order

**Master Rule:** This is the final step. There is no next step to load.
