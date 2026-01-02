# Tasks: Fix Recurrence End Date Validation Bug

**Input**: Design documents from `/specs/002-fix-recurrence-validation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Tests are included since the spec mentions independent test criteria for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, repository root
- Paths assume single project structure per `tests/` at plan.md

---

## Phase 1: Tests (TDD - Write Tests First)

**Purpose**: Write tests that FAIL before implementation to verify the bug and validate the fix

- [x] T001 [P] [US2] Write test for completing recurring task when next due exceeds end date in tests/unit/test_task_store.py
- [x] T002 [P] [US1] Write test for completing recurring task within end date in tests/unit/test_task_store.py
- [x] T003 [P] [US3] Write test for completing recurring task without end date in tests/unit/test_task_store.py
- [x] T004 [P] [US2] Write test for edge case: next due equals end date in tests/unit/test_task_store.py

**Checkpoint**: All tests written and FAILING - bug is reproduced

---

## Phase 2: User Story 2 - Complete Recurring Task When Next Due Exceeds End Date (Priority: P1) 🎯

**Goal**: Fix the bug where completing a recurring task crashes when next due date exceeds recurrence end date

**Independent Test**: Run T001 - test should now PASS after implementation

### Implementation for User Story 2

- [x] T005 [US2] Modify complete() method in src/services/task_store.py to calculate next due date and check against recurrence_end_date before creating next occurrence
- [x] T006 [US2] Modify _create_next_occurrence() to accept next_due parameter instead of recalculating in src/services/task_store.py
- [x] T007 [US2] Add boundary check: next_due <= recurrence_end_date is valid, next_due > recurrence_end_date means no new task created
- [x] T008 Run T001 to verify bug fix works - test should PASS

**Checkpoint**: Bug fixed - recurring tasks no longer crash when next due exceeds end date

---

## Phase 3: User Story 1 - Complete Weekly Recurring Task Within End Date (Priority: P1)

**Goal**: Ensure normal recurrence still works when next due is within end date bounds

**Independent Test**: Run T002 - test should PASS (validates backward compatibility)

### Implementation for User Story 1

- [x] T009 [US1] Verify complete() creates next occurrence when next_due <= recurrence_end_date in src/services/task_store.py
- [x] T010 [US1] Verify _create_next_occurrence() preserves all task attributes in src/services/task_store.py
- [x] T011 Run T002 to verify normal recurrence works - test should PASS

**Checkpoint**: Normal recurrence works correctly

---

## Phase 4: User Story 3 - Complete Recurring Task Without End Date (Priority: P2)

**Goal**: Ensure infinite recurrence (no end date) continues to work

**Independent Test**: Run T003 - test should PASS

### Implementation for User Story 3

- [x] T012 [US3] Verify complete() creates next occurrence when recurrence_end_date is None in src/services/task_store.py
- [x] T013 Run T003 to verify infinite recurrence works - test should PASS

**Checkpoint**: Infinite recurrence works correctly

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases and validation

- [x] T014 [US2] Add test for edge case: next due exactly equals end date - should create occurrence (T004)
- [x] T015 Run all tests to verify complete functionality
- [x] T016 Verify original bug scenario no longer crashes (manual test or integration test)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Tests)**: No dependencies - writes tests that FAIL
- **Phase 2 (US2 - Bug Fix)**: Depends on tests written - implements the fix
- **Phase 3 (US1)**: Depends on US2 fix - validates normal recurrence still works
- **Phase 4 (US3)**: Depends on US2 fix - validates infinite recurrence still works
- **Phase 5 (Polish)**: Depends on all implementation phases complete

### User Story Dependencies

- **User Story 2 (P1)**: Blocks US1 and US3 - this is the core fix that all recurrence logic depends on
- **User Story 1 (P1)**: Can start after US2 - validates normal case works with fix
- **User Story 3 (P2)**: Can start after US2 - validates infinite case works with fix

### Within Each User Story

- Tests written and FAIL before implementation
- Implementation follows test validation
- Story complete before moving to next

### Parallel Opportunities

- Phase 1 tests (T001-T004) can be written in parallel
- US1, US2, US3 validation runs (T008, T011, T013) can run in parallel after implementation

---

## Parallel Example: After Fix Implementation

```bash
# Run validation tests in parallel:
Task: "Run T001 - verify bug fix (US2)"
Task: "Run T002 - verify normal recurrence (US1)"
Task: "Run T003 - verify infinite recurrence (US3)"
```

---

## Implementation Strategy

### MVP First (User Story 2 Only)

1. Complete Phase 1: Write failing tests
2. Complete Phase 2: Implement bug fix
3. **STOP and VALIDATE**: Run T001 - should PASS
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Phase 1 → Tests written and failing
2. Complete Phase 2 → Bug fixed → T001 PASS
3. Complete Phase 3 → Normal recurrence still works → T002 PASS
4. Complete Phase 4 → Infinite recurrence still works → T003 PASS
5. Complete Phase 5 → All edge cases handled → All tests PASS

### Single Developer

1. Write all tests (T001-T004)
2. Implement fix (T005-T007)
3. Run T001 to verify bug fixed
4. Run T002, T003, T004 to verify all scenarios work
5. Polish phase

---

## Summary

- **Total Tasks**: 16
- **Test Tasks**: 4 (Phase 1)
- **Implementation Tasks**: 9 (Phases 2-4)
- **Polish Tasks**: 3 (Phase 5)
- **User Story 1**: 4 tasks (tests + validation)
- **User Story 2**: 5 tasks (tests + fix + validation)
- **User Story 3**: 3 tasks (test + validation)

**Parallel Opportunities**: Tests can be written in parallel, validation runs can be parallelized

**MVP Scope**: Complete Phase 1 and Phase 2 → Bug is fixed
