---
id: "0001"
title: "Create spec for recurrence validation bug fix"
stage: "spec"
date: "2026-01-02"
surface: "agent"
model: "claude-opus-4-5-20251101"
feature: "002-fix-recurrence-validation"
branch: "002-fix-recurrence-validation"
user: "sarimarain99"
command: "/sp.specify"
labels: ["bug-fix","recurrence","validation"]
links:
  spec: "specs/002-fix-recurrence-validation/spec.md"
  ticket: "null"
  adr: "null"
  pr: "null"
files:
  - "specs/002-fix-recurrence-validation/spec.md"
  - "specs/002-fix-recurrence-validation/checklists/requirements.md"
tests:
  - "none"
---

## Prompt

when I'm going to mark the mark as completed it is showing this error: Enter task ID to complete: 2
Traceback (most recent call last):
  File "/home/sarimarain99/Dev/hackathon_2/src/cli/main.py", line 965, in <module>
    main()
    ~~~~^^
  File "/home/sarimarain99/Dev/hackathon_2/src/cli/main.py", line 944, in main
    complete_task()
    ~~~~~~~~~~~~~^^
  File "/home/sarimarain99/Dev/hackathon_2/src/cli/main.py", line 340, in complete_task
    completed_task, new_task = store.complete(task_id)
                               ~~~~~~~~~~~~~~^^^^^^^^^
  File "/home/sarimarain99/Dev/hackathon_2/src/services/task_store.py", line 203, in complete
    new_task = self._create_next_occurrence(task)
  File "/home/sarimarain99/Dev/hackathon_2/src/services/task_store.py", line 251, in _create_next_occurrence
    return self.add(
           ~~~~~~~~^
        title=task.title,
        ^^^^^^^^^^^^^^^^^
    ...<5 lines>...
        reminder_offset=task.reminder_offset,
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "/home/sarimarain99/Dev/hackathon_2/src/services/task_store.py", line 69, in add
    task = Task(
        id=self._next_id,
    ...<6 lines>...
        reminder_offset=reminder_offset,
    )
  File "<string>", line 15, in __init__
  File "/home/sarimarain99/Dev/hackathon_2/src/models/task.py", line 127, in __post_init__
    raise ValueError("Recurrence end date must be on or after due date")
ValueError: Recurrence end date must be on or after due date

## Response snapshot

Created feature branch `002-fix-recurrence-validation` and specification at `specs/002-fix-recurrence-validation/spec.md`. The spec defines:

- **User Story 1** (P1): Complete recurring task within end date
- **User Story 2** (P1): Handle gracefully when next due exceeds end date (the bug scenario)
- **User Story 3** (P2): Complete recurring task without end date

Functional requirements:
- FR-001: No crash when next due exceeds recurrence end date
- FR-002: Check next due date before creating occurrence
- FR-003: Don't create new occurrence if next due exceeds end date
- FR-004: Create occurrence if next due is on/before end date
- FR-005: Preserve task attributes when creating next occurrence

Created quality checklist at `checklists/requirements.md` - all items pass.

## Outcome

- ✅ Impact: Bug fix specification created for recurring task completion crash
- 🧪 Tests: None added yet (tasks phase will add)
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: `/sp.plan` to design the fix implementation
- 🧠 Reflection: The bug occurs because `_create_next_occurrence` copies the original `recurrence_end_date` to the new task, but the new task's due date is calculated to be after the original end date, violating the validation constraint.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): checklist validation - all PASS
- Prompt variant (if applicable): standard spec generation
- Next experiment (smallest change to try): n/a
