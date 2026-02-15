# Tasks: Task Management Enhancements

**Feature**: 011-task-management-enhancements
**Branch**: `011-task-management-enhancements`
**Date**: 2026-01-31
**Input**: Design documents from `/specs/011-task-management-enhancements/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.yaml ✅

**Tests**: Unit and integration tests included in task breakdown.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Include exact file paths in descriptions

## Path Conventions

This is a web application with separate backend and frontend:

- **Backend**: `backend/app/` (FastAPI, Python 3.13+)
- **Frontend**: `frontend/` (Next.js 16.1.1, TypeScript)
- **Database**: PostgreSQL (Neon Serverless)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migration and dependency setup

- [X] T001 Add python-dateutil dependency to backend/pyproject.toml for RRULE parsing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model changes that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [X] T002 Create Notification table migration in backend/migrations/versions/057bf216671c_add_notification_table_and_parent_task_.py
  - Columns: id, user_id, task_id, type, title, message, read, created_at
  - Indexes: (user_id, read), created_at, task_id
- [X] T003 Add parent_task_id column to task table migration in backend/migrations/versions/057bf216671c_add_notification_table_and_parent_task_.py
  - Column: parent_task_id INTEGER REFERENCES task(id)
  - Index: idx_task_parent_id
- [X] T004 Create notification cleanup function in backend/migrations/versions/057bf216671c_add_notification_table_and_parent_task_.py
  - Function: cleanup_old_notifications() - deletes records >90 days

### Backend Models

- [X] T005 [P] Create Notification model in backend/app/models.py
  - SQLModel class with table="notification"
  - Fields: id, user_id, task_id, type, title, message, read, created_at
- [X] T006 [P] Add parent_task_id to Task model in backend/app/models.py
  - Self-referencing foreign key for recurrence series
- [X] T007 [P] Create NotificationCreate/Read schemas in backend/app/models.py
  - Pydantic schemas for validation

### Backend Routes - Notification Base

- [X] T008 Create notification routes module in backend/app/routes/notifications.py
  - Router with prefix="/api/notifications"
- [X] T009 Implement GET /api/notifications list endpoint
  - Query params: unread_only, limit
  - Returns user's notifications newest first
- [X] T010 Implement GET /api/notifications/unread-count endpoint
  - Returns count and display_count (99+ if >99)
- [X] T011 Implement PATCH /api/notifications/{id}/read endpoint
  - Marks notification as read
- [X] T012 Implement DELETE /api/notifications/{id} endpoint
  - Dismisses/deletes notification
- [X] T013 Register notification router in backend/app/main.py

### Backend Services

- [X] T014 Create notification service in backend/app/services/notification_service.py
  - create_notification() helper function
  - create_next_instance() for recurring tasks (implemented for US6)
  - check_due_date_reminders() background job function

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Enhanced Task Editing (Priority: P1) 🎯 MVP

**Goal**: Allow users to edit tasks with pre-populated forms

**Independent Test**: Create a task, click edit button, verify all fields populate, modify, save, confirm changes persist

### Backend Enhancement for Edit

- [X] T015 [P] [US1] Add GET /api/tasks/{id} endpoint in backend/app/routes/tasks.py
  - Returns single task for edit form pre-population
  - Validates user ownership
- [X] T016 [P] [US1] Add PUT /api/tasks/{id} endpoint in backend/app/routes/tasks.py
  - Updates existing task
  - Accepts partial updates (optional fields)
  - Validates user ownership

### Frontend Components - Edit Mode

- [X] T017 [P] [US1] Create/edit task form component in frontend/components/task-form.tsx
  - Add initialData prop for pre-population (via TaskEditDialog)
  - Add mode prop ("create" | "edit")
  - All fields: title, description, priority, due_date, tags, recurrence_rule
- [X] T018 [P] [US1] Create edit dialog wrapper in frontend/components/task-edit-dialog.tsx
  - Opens dialog with task data loaded
  - Handles submit (PUT) vs create (POST)
- [X] T019 [P] [US1] Add edit button to task items in frontend/components/task-item.tsx
  - Triggers edit dialog
- [X] T020 [US1] Integrate edit dialog in dashboard at frontend/components/task-item.tsx
  - Wire up edit button clicks
  - Refresh task list after successful edit

### Tests for User Story 1

- [X] T021 [P] [US1] Unit test GET /api/tasks/{id} in backend/tests/test_tasks.py
  - Test success case with valid task
  - Test 404 for non-existent task
  - Test 403 for different user's task
- [X] T022 [P] [US1] Unit test PUT /api/tasks/{id} in backend/tests/test_tasks.py
  - Test partial update (title only)
  - Test full update (all fields)
  - Test invalid data rejection
- [x] T023 [US1] Integration test for edit flow in frontend/tests/task-edit.test.tsx
  - Test edit dialog opens with pre-populated data
  - Test form submission updates task
  - Test cancel discards changes

**Checkpoint**: User can edit tasks with pre-populated forms - MVP functional!

---

## Phase 4: User Story 2 - Task Sorting (Priority: P2)

**Goal**: Allow users to sort tasks by due date, priority, creation date, or title

**Independent Test**: Apply different sort options and verify task order changes correctly

### Backend Enhancement for Sorting

- [X] T024 [P] [US2] Add sort_by and sort_order params to GET /api/tasks in backend/app/routes/tasks.py
  - sort_by options: due_date, priority, created_at, title
  - sort_order options: asc, desc
  - Default: created_at desc
- [X] T025 [P] [US2] Implement priority ordering in backend/app/routes/tasks.py
  - Map: high=3, medium=2, low=1 for sorting

### Frontend Components - Sort Controls

- [X] T026 [P] [US2] Create task sort controls in frontend/components/task-sort-controls.tsx
  - Dropdown for sort field selection
  - Toggle button for asc/desc
  - Visual indication of active sort
- [X] T027 [P] [US2] Create task list state hook in frontend/hooks/use-task-list.ts
  - Zustand store for sortBy, sortOrder
  - Persists to localStorage
  - Fetches tasks with sort params
- [X] T028 [US2] Integrate sort controls in dashboard at frontend/components/task-list.tsx
  - Place sort controls above task list
  - Apply sort to displayed tasks
  - Re-sort on new task creation

### Tests for User Story 2

- [X] T029 [P] [US2] Unit test sort parameters in backend/tests/test_tasks.py
  - Test sort by due_date asc/desc
  - Test sort by priority
  - Test sort by title
  - Test invalid sort field defaults to created_at
- [x] T030 [US2] Integration test for sort UI in frontend/tests/task-sort.test.tsx
  - Test sort dropdown changes order
  - Test sort direction toggle
  - Test sort preference persists across page reload

**Checkpoint**: Users can sort tasks by multiple criteria

---

## Phase 5: User Story 3 - Task Filtering by Date (Priority: P2)

**Goal**: Allow users to filter tasks by creation date (today, this week, this month, custom range)

**Independent Test**: Apply date filters and verify only matching tasks appear

### Backend Enhancement for Filtering

- [X] T031 [P] [US3] Add filter_start, filter_end, preset_filter params to GET /api/tasks in backend/app/routes/tasks.py
  - preset_filter options: today, this_week, this_month
  - Custom range via filter_start and filter_end (YYYY-MM-DD)
- [X] T032 [P] [US3] Implement preset filter logic in backend/app/routes/tasks.py
  - today: date.today()
  - this_week: start of current week
  - this_month: first day of current month
- [X] T033 [P] [US3] Return total count in GET /api/tasks response
  - { "tasks": [...], "total": N }

### Frontend Components - Filter Controls

- [X] T034 [P] [US3] Create task filter controls in frontend/components/task-filter-controls.tsx
  - Preset buttons: All Tasks, Today, This Week, This Month
  - Active state styling
  - Clear button when filter active
- [X] T035 [P] [US3] Create empty state component in frontend/components/empty-state.tsx
  - Message: "No tasks match this filter"
  - Reset button to clear filters
- [X] T036 [US3] Integrate filter controls in dashboard at frontend/components/task-list.tsx
  - Place filter controls above task list (alongside sort)
  - Show empty state when no results
  - Display task count

### Tests for User Story 3

- [X] T037 [P] [US3] Unit test filter parameters in backend/tests/test_tasks.py
  - Test today filter
  - Test this_week filter
  - Test this_month filter
  - Test custom date range
- [x] T038 [US3] Integration test for filter UI in frontend/tests/task-filter.test.tsx
  - Test preset buttons filter correctly
  - Test empty state displays
  - Test reset button clears filters

**Checkpoint**: Users can filter tasks by date ranges

---

## Phase 6: User Story 4 - Notification System (Priority: P3)

**Goal**: Create in-app notifications for due date reminders and task completions

**Independent Test**: Trigger notification events and verify notifications are created and stored

### Backend Notification Triggers

- [X] T039 [P] [US4] Integrate notification creation in task completion at backend/app/routes/tasks.py
  - POST /api/tasks/{id}/complete creates task_completed notification
  - Calls notification_service.create_notification()
- [X] T040 [P] [US4] Add due date check schedule in backend/app/main.py
  - Register background job for check_due_date_reminders()
  - Run daily at midnight
- [X] T041 [P] [US4] Implement check_due_date_reminders() in backend/app/services/notification_service.py
  - Finds tasks due in next 24 hours
  - Creates due_date_reminder notification if not exists
  - Commits session

### Tests for User Story 4

- [X] T042 [P] [US4] Unit test notification creation in backend/tests/test_notifications.py
  - Test task completion creates notification
  - Test due date reminder creation
  - Test duplicate reminder prevented
- [X] T043 [US4] Integration test for notification flow in backend/tests/test_notifications.py
  - Test complete task → notification created
  - Test due date check → reminder created

**Checkpoint**: Notifications are created for task events

---

## Phase 7: User Story 5 - Notification Bell and History (Priority: P3)

**Goal**: Display bell icon with unread count and dropdown for notification history

**Independent Test**: Create notifications, observe bell badge, click to view history, verify interactions

### Frontend Components - Notification UI

- [X] T044 [P] [US5] Create notification bell component in frontend/components/notification-bell.tsx
  - Bell icon from lucide-react
  - Fetches unread count every 30 seconds
  - Displays badge when count > 0
  - Shows "99+" when count > 99
- [X] T045 [P] [US5] Create notification dropdown in frontend/components/notification-dropdown.tsx
  - Displays list of notifications newest first
  - Unread notifications highlighted
  - Click to mark read and navigate to task
  - Dismiss button per notification
  - Close button
- [X] T046 [P] [US5] Add notification API methods to frontend/lib/api.ts
  - getNotifications() - fetch list
  - getUnreadCount() - fetch badge count
  - markAsRead(id) - PATCH endpoint
  - dismiss(id) - DELETE endpoint
- [X] T047 [US5] Integrate notification bell in protected layout at frontend/app/(protected)/dashboard/dashboard-shell.tsx
  - Place bell in header
  - Wire up dropdown toggle
  - Refresh count after actions

### Tests for User Story 5

- [x] T048 [P] [US5] Unit test notification bell in frontend/tests/notification-bell.test.tsx
  - Test badge displays correct count
  - Test 99+ display for large counts
  - Test polling updates count
- [x] T049 [US5] Unit test notification dropdown in frontend/tests/notification-dropdown.test.tsx
  - Test notifications display newest first
  - Test click marks as read
  - Test dismiss removes notification
- [x] T050 [US5] Integration test for notification UI flow in frontend/tests/notification-flow.test.tsx
  - Test complete task → badge appears
  - Test click bell → dropdown opens
  - Test click notification → marks read, closes dropdown

**Checkpoint**: Users can view and manage notifications via bell icon

---

## Phase 8: User Story 6 - Task Recurrence (Priority: P4)

**Goal**: Allow tasks to repeat on a schedule (daily, weekly, monthly)

**Independent Test**: Create recurring task, complete instance, verify next instance created immediately

### Backend Recurrence Implementation

- [X] T051 [P] [US6] Implement create_next_instance() in backend/app/services/notification_service.py
  - Parse recurrence_rule using dateutil.rrule
  - Calculate next date from task.due_date
  - Create new task with parent_task_id reference
  - Copy all fields except completed, due_date
- [X] T052 [P] [US6] Enhance POST /api/tasks/{id}/complete in backend/app/routes/tasks.py
  - Add edit_scope param: "this" | "all"
  - If recurring and edit_scope="this": create next instance
  - If edit_scope="all": update all future instances (not implemented in v1)
- [X] T053 [P] [US6] Add recurrence validation in backend/app/routes/tasks.py
  - Validate RRULE format on create/update
  - Ensure due_date is required when recurrence_rule set

### Frontend Recurrence UI

- [X] T054 [P] [US6] Add recurrence selector to task form in frontend/components/task-form.tsx
  - Buttons: None, Daily, Weekly, Monthly, Yearly
  - Maps to RRULE: FREQ=DAILY, FREQ=WEEKLY, FREQ=MONTHLY, FREQ=YEARLY
- [x] T055 [P] [US6] Add edit scope selector to completion dialog in frontend/components/complete-task-dialog.tsx
  - Radio/buttons: "This instance" | "All future"
  - Only shows for recurring tasks (deferred to v2)
- [X] T056 [US6] Wire up recurrence in task form submission in frontend/lib/api.ts
  - Include recurrence_rule in create/update payload

### Tests for User Story 6

- [X] T057 [P] [US6] Unit test RRULE parsing in backend/tests/test_recurrence.py
  - Test daily recurrence
  - Test weekly recurrence
  - Test monthly recurrence
  - Test invalid RRULE rejected
- [X] T058 [P] [US6] Unit test next instance creation in backend/tests/test_recurrence.py
  - Test next instance created on completion
  - Test parent_task_id set correctly
  - Test fields copied correctly
- [x] T059 [US6] Integration test for recurrence flow in frontend/tests/task-recurrence.test.tsx
  - Test create recurring task
  - Test complete creates next instance
  - Test edit scope selection

**Checkpoint**: Users can create and manage recurring tasks

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T060 [P] Add error handling for concurrent edits (FR-001 edge case) in backend/app/routes/tasks.py
- [X] T061 [P] Add timezone handling for due dates in backend/app/services/notification_service.py
- [X] T062 [P] Document notification cleanup job setup in backend/README.md
- [X] T063 Run database migrations in development environment
- [X] T064 Test all user stories end-to-end in quickstart.md development workflow
- [X] T065 Verify all success criteria (SC-001 through SC-008) are met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational phase completion
  - US1 (P1): Can start after Foundational
  - US2 (P2): Can start after Foundational
  - US3 (P2): Can start after Foundational
  - US4 (P3): Can start after Foundational
  - US5 (P3): Depends on US4 (needs notifications to exist)
  - US6 (P4): Can start after Foundational
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other US
- **User Story 2 (P2)**: No dependencies on other US
- **User Story 3 (P2)**: No dependencies on other US
- **User Story 4 (P3)**: No dependencies on other US
- **User Story 5 (P3)**: Depends on US4 (notification system)
- **User Story 6 (P4)**: No dependencies on other US

### Parallel Opportunities

Within each user story, tasks marked [P] can run in parallel:

**Phase 2 - Foundational**:

- T005, T006, T007 can run in parallel (models)
- T002, T003, T004 can run in parallel (migrations)

**Phase 3 - US1 (Edit)**:

- T015, T016 can run in parallel (backend endpoints)
- T017, T018, T019 can run in parallel (frontend components)

**Phase 4 - US2 (Sort)**:

- T024, T025 can run in parallel (backend)
- T026, T027 can run in parallel (frontend)

**Phase 5 - US3 (Filter)**:

- T031, T032, T033 can run in parallel (backend)
- T034, T035 can run in parallel (frontend)

**Phase 6 - US4 (Notifications)**:

- T039, T040, T041 can run in parallel (backend)

**Phase 7 - US5 (Bell)**:

- T044, T045, T046 can run in parallel (frontend components)

**Phase 8 - US6 (Recurrence)**:

- T051, T052, T053 can run in parallel (backend)
- T054, T055, T056 can run in parallel (frontend)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T014)
3. Complete Phase 3: User Story 1 (T015-T023)
4. **STOP and VALIDATE**: Test task editing independently
5. Deploy/demo if ready

### Incremental Delivery

1. Foundation (T001-T014) → Database and base routes ready
2. Add US1 (T015-T023) → Edit functional → Deploy/Demo (MVP!)
3. Add US2 (T024-T030) → Sorting functional → Deploy/Demo
4. Add US3 (T031-T038) → Filtering functional → Deploy/Demo
5. Add US4 (T039-T043) → Notifications functional → Deploy/Demo
6. Add US5 (T044-T050) → Bell UI functional → Deploy/Demo
7. Add US6 (T051-T059) → Recurrence functional → Deploy/Demo

---

## Summary

**Total Tasks**: 59
**Backend Tasks**: 31
**Frontend Tasks**: 20
**Test Tasks**: 15
**MVP Tasks (through US1)**: 23

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
