# Phase I: CLI Contract

**Type**: Console Application
**Interface**: Menu-driven terminal

## Commands

### Main Menu

```
╔══════════════════════════════════════════╗
║           TODO LIST MANAGER              ║
╠══════════════════════════════════════════╣
║  1. Add Task                             ║
║  2. List Tasks                           ║
║  3. Update Task                          ║
║  4. Delete Task                          ║
║  5. Complete Task                        ║
║  6. Exit                                 ║
╚══════════════════════════════════════════╝
Enter choice (1-6):
```

### Command: Add Task

**Input**:
```
Enter task title: Buy groceries
Enter description (optional, press Enter to skip): Get milk, bread, eggs
Enter priority (low/medium/high) [medium]: high
Enter due date (YYYY-MM-DD, optional):
```

**Output (Success)**:
```
✅ Task created successfully!
ID: 1
Title: Buy groceries
Priority: high
```

**Output (Error)**:
```
❌ Error: Task title cannot be empty
```

### Command: List Tasks

**Input**: None (automatic)

**Output (With Tasks)**:
```
┌────┬─────────────────┬──────────┬───────────┬────────────┐
│ ID │ Title           │ Priority │ Status    │ Due Date   │
├────┼─────────────────┼──────────┼───────────┼────────────┤
│ 1  │ Buy groceries   │ high     │ ⬜ Pending │ 2025-01-02 │
│ 2  │ Finish report   │ medium   │ ✅ Done    │ -          │
│ 3  │ Call mom        │ low      │ ⬜ Pending │ -          │
└────┴─────────────────┴──────────┴───────────┴────────────┘

Total: 3 tasks (2 pending, 1 completed)
```

**Output (Empty)**:
```
📋 No tasks yet. Add your first task!
```

### Command: Update Task

**Input**:
```
Enter task ID to update: 1
Current title: Buy groceries
Enter new title (press Enter to keep current): Buy fruits
Updated successfully!
```

**Output (Error)**:
```
❌ Error: Task with ID 99 not found
```

### Command: Delete Task

**Input**:
```
Enter task ID to delete: 1
Are you sure you want to delete "Buy groceries"? (y/n): y
```

**Output (Success)**:
```
🗑️ Task deleted successfully
```

### Command: Complete Task

**Input**:
```
Enter task ID to complete: 1
```

**Output (Success)**:
```
✅ Task "Buy groceries" marked as complete!
```

**Output (Already Complete)**:
```
ℹ️ Task "Buy groceries" is already complete. Mark as incomplete? (y/n): y
✅ Task marked as incomplete
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Normal exit |
| 1 | Invalid input |
| 2 | Task not found |

## Module Interface

```python
# src/services/task_store.py
class TaskStore:
    def add(self, title: str, **kwargs) -> Task: ...
    def get(self, task_id: int) -> Optional[Task]: ...
    def list_all(self) -> list[Task]: ...
    def update(self, task_id: int, **kwargs) -> Optional[Task]: ...
    def delete(self, task_id: int) -> bool: ...
    def complete(self, task_id: int) -> Optional[Task]: ...
    def uncomplete(self, task_id: int) -> Optional[Task]: ...
```
