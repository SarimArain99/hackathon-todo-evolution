---
id: "0002"
title: "Create implementation plan for recurrence bug fix"
stage: "plan"
date: "2026-01-02"
surface: "agent"
model: "claude-opus-4-5-20251101"
feature: "002-fix-recurrence-validation"
branch: "002-fix-recurrence-validation"
user: "sarimarain99"
command: "/sp.plan"
labels: ["bug-fix","recurrence","planning"]
links:
  spec: "specs/002-fix-recurrence-validation/spec.md"
  ticket: "null"
  adr: "null"
  pr: "null"
files:
  - "specs/002-fix-recurrence-validation/plan.md"
tests:
  - "none"
---

## Prompt

$ARGUMENTS

## Response snapshot

Created comprehensive implementation plan for fixing the recurrence validation bug. The plan identifies:

**The Bug**: In `task_store.py:_create_next_occurrence()`, the method calculates the next due date but copies the original `recurrence_end_date` to the new task without checking if the new due date exceeds it. When `Task.__post_init__()` validates this, it raises `ValueError`.

**The Fix**: Modify `complete()` method to:
1. Calculate the next due date first
2. Check if `next_due <= recurrence_end_date` before creating the new task
3. Only call `_create_next_occurrence()` if the check passes
4. Pass `next_due` as a parameter to avoid recalculation

**Design Decisions**:
- Validation happens in `complete()` before calling `_create_next_occurrence()` - keeps concerns separated
- Boundary condition: `next_due <= recurrence_end_date` allows one final occurrence on the end date
- No end date (`None`) means infinite recurrence - always create next task
- Preserved all existing behavior for valid cases

**Constitution Checks**: All gates pass (pre and post-design).

**Agent context updated**: Added Python 3.13+ and Rich library to CLAUDE.md.

## Outcome

- ✅ Impact: Complete implementation plan for recurrence validation bug fix
- 🧪 Tests: None yet (will be added in /sp.tasks phase)
- 📁 Files: plan.md created, agent context updated
- 🔁 Next prompts: `/sp.tasks` to generate atomic task units
- 🧠 Reflection: This is a straightforward bug fix with a single obvious solution. No research needed as the bug location and root cause were clearly identifiable from the error trace. The fix maintains backward compatibility and improves error handling.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): constitution gates all PASS
- Prompt variant (if applicable): standard plan generation
- Next experiment (smallest change to try): n/a
