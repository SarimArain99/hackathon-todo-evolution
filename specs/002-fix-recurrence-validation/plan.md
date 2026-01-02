# Implementation Plan: Fix Recurrence End Date Validation Bug

**Branch**: `002-fix-recurrence-validation` | **Date**: 2026-01-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-fix-recurrence-validation/spec.md`

## Summary

Fix a bug where completing a recurring task crashes with "Recurrence end date must be on or after due date" error. The issue occurs in `task_store.py:_create_next_occurrence()` which copies the original `recurrence_end_date` to the next task without checking if the calculated next due date exceeds it. The fix validates the next due date against the recurrence end date BEFORE attempting to create the new task.

## Technical Context

**Language/Version**: Python 3.13+
**Primary Dependencies**: Rich library (console UI)
**Storage**: In-memory dictionary (Phase I)
**Testing**: pytest
**Target Platform**: Linux/WSL console application
**Project Type**: Single Python project
**Performance Goals**: N/A (in-memory, single-user)
**Constraints**: Maintain backward compatibility with existing task model
**Scale/Scope**: Single-user console application, <100 tasks expected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Spec-driven development followed | ✅ PASS | Spec created via `/sp.specify` |
| No code written before plan | ✅ PASS | Planning phase only |
| Technology stack compliant | ✅ PASS | Python 3.13+ as required |
| Phase scope respected | ✅ PASS | Phase I in-memory fix |

**Post-Design Re-Check** (Phase 1 complete):

| Gate | Status | Notes |
|------|--------|-------|
| Clean architecture maintained | ✅ PASS | Separation of concerns preserved |
| No new dependencies added | ✅ PASS | Uses existing datetime module |
| Error handling improved | ✅ PASS | Graceful handling of edge case |
| No implementation details in plan | ✅ PASS | Design described, not coded |

## Project Structure

### Documentation (this feature)

```text
specs/002-fix-recurrence-validation/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # N/A - no unknowns to research
├── data-model.md        # N/A - no data model changes needed
├── quickstart.md        # N/A - no new patterns
├── contracts/           # N/A - no API contracts needed
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
# Single project structure (Phase I)
src/
├── models/
│   └── task.py          # Task model with validation (BUG: line 125-127)
├── services/
│   └── task_store.py    # TaskStore with complete() method (BUG: line 247-259)
├── cli/
│   └── main.py          # CLI entry point (not modified)
└── lib/                 # Utility functions

tests/
├── contract/            # N/A
├── integration/         # N/A
└── unit/
    └── test_task_store.py  # Add tests for recurrence fix
```

**Structure Decision**: Single project structure (Phase I). No changes to project structure - fix is contained within existing modules.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Phase 0: Research

**Status**: COMPLETE - No research needed

This is a simple bug fix with no unknowns:
- The bug location is known: `task_store.py:_create_next_occurrence()` line 247-259
- The root cause is known: `recurrence_end_date` copied without validation
- The fix is straightforward: check next due date before creating task

## Phase 1: Design

### The Bug

In `src/services/task_store.py`, the `_create_next_occurrence()` method:

```python
def _create_next_occurrence(self, task: Task) -> Task:
    """Create the next occurrence of a recurring task."""
    next_due = self._calculate_next_due(task.due_date, task.recurrence)

    return self.add(
        title=task.title,
        description=task.description,
        priority=task.priority,
        due_date=next_due,
        recurrence=task.recurrence,
        recurrence_end_date=task.recurrence_end_date,  # BUG: copied without check
        reminder_offset=task.reminder_offset,
    )
```

The `Task` model at `src/models/task.py:125-127` validates:

```python
if self.recurrence_end_date and self.due_date:
    if self.recurrence_end_date < self.due_date:
        raise ValueError("Recurrence end date must be on or after due date")
```

When the next due date exceeds the recurrence end date, the validation fails.

### The Fix

Modify `complete()` method in `task_store.py` to check if the next due date would exceed the recurrence end date BEFORE calling `_create_next_occurrence()`:

```python
def complete(self, task_id: int) -> tuple[Optional[Task], Optional[Task]]:
    """Mark a task as completed. If recurring, creates next occurrence."""
    task = self._tasks.get(task_id)
    if task is None:
        return (None, None)

    task.status = TaskStatus.COMPLETED

    # Handle recurring task - create next occurrence
    new_task = None
    if task.recurrence and task.due_date:
        # Calculate next due date
        next_due = self._calculate_next_due(task.due_date, task.recurrence)

        # Check if next due date exceeds recurrence end date
        should_create = (
            not task.recurrence_end_date  # No end date = infinite recurrence
            or next_due <= task.recurrence_end_date  # Next due is within bounds
        )

        if should_create:
            new_task = self._create_next_occurrence(task, next_due)

    return (task, new_task)

def _create_next_occurrence(self, task: Task, next_due: datetime) -> Task:
    """Create the next occurrence of a recurring task."""
    return self.add(
        title=task.title,
        description=task.description,
        priority=task.priority,
        due_date=next_due,
        recurrence=task.recurrence,
        recurrence_end_date=task.recurrence_end_date,
        reminder_offset=task.reminder_offset,
    )
```

### Design Decisions

1. **Validation location**: Check happens in `complete()` before calling `_create_next_occurrence()` - keeps validation logic separate from creation logic.

2. **Boundary condition**: `next_due <= recurrence_end_date` - when next due equals end date, it's still valid (creates one final occurrence).

3. **No end date**: When `recurrence_end_date` is `None`, always create next occurrence (infinite recurrence).

4. **Preserved behavior**: When next due is valid, all attributes are copied exactly as before.

## Phase 2: Tasks

**Output**: `tasks.md` (generated by `/sp.tasks` command)

## Generated Artifacts

| File | Status | Description |
|------|--------|-------------|
| `plan.md` | ✅ Created | This file |
| `research.md` | ⏭ Skipped | No unknowns |
| `data-model.md` | ⏭ Skipped | No data model changes |
| `quickstart.md` | ⏭ Skipped | No new patterns |
| `contracts/` | ⏭ Skipped | No API changes |
| `tasks.md` | ⏭ Pending | `/sp.tasks` command |

## Next Steps

1. Run `/sp.tasks` to generate atomic task units
2. Implement fix following task IDs
3. Add unit tests for recurrence edge cases
4. Verify all acceptance criteria from spec

## ADR Candidates

No architectural decisions requiring documentation - this is a straightforward bug fix with one obvious solution.
