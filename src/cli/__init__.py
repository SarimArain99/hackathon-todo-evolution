"""CLI package for todo-evolution."""

from src.cli.main import (
    add_task,
    complete_task,
    delete_task,
    display_menu,
    list_tasks,
    main as main_entry,
    store,
    update_task,
)

__all__ = [
    "add_task",
    "complete_task",
    "delete_task",
    "display_menu",
    "list_tasks",
    "main_entry",
    "store",
    "update_task",
]
