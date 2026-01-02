# Feature Specification: Fix Recurrence End Date Validation Bug

**Feature Branch**: `002-fix-recurrence-validation`
**Created**: 2026-01-02
**Status**: Draft
**Input**: User description: "When completing a recurring task, the system crashes with 'Recurrence end date must be on or after due date' error because the _create_next_occurrence method copies the original recurrence_end_date to the next occurrence, but the new task's due date is calculated to be after the original recurrence_end_date"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Weekly Recurring Task Within End Date (Priority: P1)

As a user with a recurring task that has a future recurrence end date, I want to complete the task and have the next occurrence created automatically, so I can continue my recurring workflow without interruption.

**Why this priority**: This is the primary use case for recurring tasks and must work correctly.

**Independent Test**: Can be tested by creating a task with weekly recurrence, end date in the future, completing it, and verifying the next occurrence is created.

**Acceptance Scenarios**:

1. **Given** a task with weekly recurrence and end date set to next month, **When** the user completes the task, **Then** a new task occurrence should be created with the correct next due date (1 week later) and the same recurrence settings.

2. **Given** a task with daily recurrence and end date set to 5 days from now, **When** the user completes the task on day 1, **Then** a new task occurrence should be created with the next day's due date.

---

### User Story 2 - Complete Recurring Task When Next Due Exceeds End Date (Priority: P1)

As a user with a recurring task approaching its end date, I want the task completion to gracefully stop creating new occurrences when the recurrence period ends, so I don't experience errors or crashes.

**Why this priority**: This is the bug scenario - the system currently crashes instead of gracefully handling this case.

**Independent Test**: Can be tested by creating a task with a near-term recurrence end date, completing it when the next due date would exceed the end date, and verifying no crash occurs and no new task is created.

**Acceptance Scenarios**:

1. **Given** a task with weekly recurrence, due today, and end date tomorrow, **When** the user completes the task, **Then** no error should occur and no new task should be created (recurrence has ended).

2. **Given** a task with daily recurrence for 3 days total (day 1, day 2, day 3), **When** the user completes day 2 and day 3's next due date would exceed the end date, **Then** the completion should succeed but no further tasks should be created.

---

### User Story 3 - Complete Recurring Task Without End Date (Priority: P2)

As a user with an ongoing recurring task (no end date), I want to complete the task and have the next occurrence created indefinitely, so I can maintain my recurring workflow forever.

**Why this priority**: Common use case for tasks like "take medication" or "weekly exercise" that have no fixed end.

**Independent Test**: Can be tested by creating a task with recurrence but no end date, completing it, and verifying the next occurrence is created.

**Acceptance Scenarios**:

1. **Given** a task with monthly recurrence and no end date, **When** the user completes the task, **Then** a new task occurrence should be created with the next month's due date and no recurrence end date.

---

### Edge Cases

- What happens when the original task's due date exactly equals the recurrence end date?
- How does the system handle timezone differences between due date and recurrence end date?
- What happens when the calculated next due date is the same as the recurrence end date (edge boundary)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST NOT crash when completing a recurring task where the next occurrence's due date would exceed the recurrence end date.
- **FR-002**: The system MUST check if the calculated next due date exceeds the recurrence end date before creating the next occurrence.
- **FR-003**: If the next due date exceeds the recurrence end date, the system MUST NOT create a new task occurrence.
- **FR-004**: If the next due date is on or before the recurrence end date, the system MUST create the next occurrence with correct settings.
- **FR-005**: The system MUST preserve all other task attributes (title, description, priority, reminder) when creating the next occurrence.

### Key Entities *(include if feature involves data)*

- **Task**: The task entity already exists with recurrence, due_date, and recurrence_end_date attributes. The fix requires adjusting the logic in `complete()` method to validate the next due date against the recurrence end date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete recurring tasks without system crashes (0% crash rate for task completion).
- **SC-002**: Recurring tasks with end dates correctly stop creating new occurrences when the end date is reached or exceeded.
- **SC-003**: Recurring tasks without end dates continue creating new occurrences indefinitely.
- **SC-004**: All edge cases involving date boundaries are handled gracefully without errors.
