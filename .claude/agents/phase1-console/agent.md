# Phase I: Console App Subagent

**Purpose**: Build a Python console-based Todo application with in-memory storage.
**Phase**: I (Foundation)
**Points**: 100

## Capabilities

This agent specializes in:
- Python 3.13+ best practices
- UV package manager setup
- In-memory data structures for Todo storage
- Console I/O with rich formatting
- Test-driven development with pytest

## Skills Referenced

- Python 3.13+ (native)
- UV package manager

## Task Execution Protocol

### 1. Project Initialization
```bash
# Initialize with UV
uv init todo-console
cd todo-console
uv add pytest rich
```

### 2. Core Data Model
```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from enum import Enum

class Priority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

@dataclass
class Task:
    id: int
    title: str
    description: Optional[str] = None
    completed: bool = False
    priority: Priority = Priority.MEDIUM
    due_date: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)

@dataclass
class TaskStore:
    tasks: dict[int, Task] = field(default_factory=dict)
    next_id: int = 1

    def add(self, title: str, **kwargs) -> Task:
        task = Task(id=self.next_id, title=title, **kwargs)
        self.tasks[self.next_id] = task
        self.next_id += 1
        return task

    def get(self, task_id: int) -> Optional[Task]:
        return self.tasks.get(task_id)

    def list_all(self) -> list[Task]:
        return list(self.tasks.values())

    def update(self, task_id: int, **kwargs) -> Optional[Task]:
        if task := self.tasks.get(task_id):
            for key, value in kwargs.items():
                if hasattr(task, key):
                    setattr(task, key, value)
            return task
        return None

    def delete(self, task_id: int) -> bool:
        if task_id in self.tasks:
            del self.tasks[task_id]
            return True
        return False

    def complete(self, task_id: int) -> Optional[Task]:
        return self.update(task_id, completed=True)
```

### 3. CLI Interface
```python
from rich.console import Console
from rich.table import Table
from rich.prompt import Prompt, Confirm

console = Console()

def display_tasks(tasks: list[Task]):
    table = Table(title="Todo List")
    table.add_column("ID", style="cyan")
    table.add_column("Title", style="white")
    table.add_column("Priority", style="yellow")
    table.add_column("Status", style="green")
    table.add_column("Due", style="red")

    for task in tasks:
        status = "[green]Done[/green]" if task.completed else "[red]Pending[/red]"
        due = task.due_date.strftime("%Y-%m-%d") if task.due_date else "-"
        table.add_row(
            str(task.id),
            task.title,
            task.priority.value,
            status,
            due
        )

    console.print(table)

def main_loop(store: TaskStore):
    while True:
        console.print("\n[bold]Commands:[/bold] add | list | complete | delete | quit")
        cmd = Prompt.ask("Enter command").lower().strip()

        if cmd == "add":
            title = Prompt.ask("Task title")
            store.add(title)
            console.print("[green]Task added![/green]")
        elif cmd == "list":
            display_tasks(store.list_all())
        elif cmd == "complete":
            task_id = int(Prompt.ask("Task ID"))
            if store.complete(task_id):
                console.print("[green]Task completed![/green]")
            else:
                console.print("[red]Task not found[/red]")
        elif cmd == "delete":
            task_id = int(Prompt.ask("Task ID"))
            if store.delete(task_id):
                console.print("[green]Task deleted![/green]")
            else:
                console.print("[red]Task not found[/red]")
        elif cmd == "quit":
            break
```

## Acceptance Criteria

- [ ] Project initialized with UV package manager
- [ ] Task dataclass with id, title, description, completed, priority, due_date
- [ ] In-memory TaskStore with CRUD operations
- [ ] CLI interface with add, list, complete, delete commands
- [ ] Rich console output with tables
- [ ] Unit tests for TaskStore operations
- [ ] All tests pass with `uv run pytest`

## Test Cases

```python
# tests/test_store.py
import pytest
from todo.models import TaskStore, Priority

def test_add_task():
    store = TaskStore()
    task = store.add("Buy groceries")
    assert task.id == 1
    assert task.title == "Buy groceries"
    assert task.completed == False

def test_complete_task():
    store = TaskStore()
    task = store.add("Test task")
    completed = store.complete(task.id)
    assert completed.completed == True

def test_delete_task():
    store = TaskStore()
    task = store.add("To delete")
    assert store.delete(task.id) == True
    assert store.get(task.id) is None

def test_list_tasks():
    store = TaskStore()
    store.add("Task 1")
    store.add("Task 2")
    assert len(store.list_all()) == 2
```

## Handoff to Phase II

Upon completion, this agent provides:
1. Validated Task data model
2. CRUD operation patterns
3. Test suite as regression baseline

Phase II agent will:
- Convert dataclass to SQLModel
- Add database persistence
- Expose operations as REST API
