"""Rich console CLI for Phase I todo application."""
import os
import sys
from datetime import date, datetime, timedelta
from typing import Optional

from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm, Prompt
from rich.table import Table

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from src.models.task import (
    DueDateFilter,
    Priority,
    RecurrencePattern,
    ReminderOffset,
    SortKey,
    Task,
    TaskStatus,
)
from src.services.task_store import TaskStore

console = Console()
store = TaskStore()


def display_menu() -> None:
    """Display the main menu with Rich styling."""
    menu_text = """
 [bold white]TASK OPERATIONS[/bold white]
 [bold cyan]1[/bold cyan]  Add New Task        [bold cyan]4[/bold cyan]  Delete Task
 [bold cyan]2[/bold cyan]  List All Tasks      [bold cyan]5[/bold cyan]  Complete Task
 [bold cyan]3[/bold cyan]  Update Task         [bold cyan]6[/bold cyan]  Mark In Progress

 [bold white]VIEW & ORGANIZE[/bold white]
 [bold cyan]7[/bold cyan]  Search Tasks        [bold cyan]c[/bold cyan]  Calendar Views
 [bold cyan]8[/bold cyan]  Filter Tasks        [bold cyan]r[/bold cyan]  Reminders
 [bold cyan]9[/bold cyan]  Sort Tasks

 [bold cyan]0[/bold cyan]  [bold red]Exit Application[/bold red]
"""
    # Show active filters and sort indicators
    indicators = []

    active_filters = store.get_active_filters()
    if active_filters:
        items = []
        for k, v in active_filters.items():
            val = v.value if hasattr(v, "value") else str(v)
            items.append(f"{k}=[yellow]{val}[/yellow]")
        indicators.append(f"Filters: {', '.join(items)}")

    sort_key, descending = store.get_current_sort()
    dir_str = "desc" if descending else "asc"
    indicators.append(f"Sort: [yellow]{sort_key.value}[/yellow] ([dim]{dir_str}[/dim])")

    # Add overdue warning if any
    overdue_count = len(store.get_overdue_tasks())
    if overdue_count > 0:
        indicators.append(f"[bold red]OVERDUE: {overdue_count}[/bold red]")

    # Build the panel
    content = menu_text
    if indicators:
        content += f"\n [dim]Status: {' | '.join(indicators)}[/dim]"

    panel = Panel(
        content,
        title="[bold yellow]TODO EVOLUTION - CONSOLE MANAGER[/bold yellow]",
        border_style="cyan",
        padding=(1, 2),
    )
    console.print(panel)


def add_task() -> None:
    """Handle adding a new task with Rich prompts."""
    console.print("\n[bold cyan]Add New Task[/bold cyan]\n")

    # Get title (required)
    title = Prompt.ask("[yellow]Enter task title[/yellow]")
    if not title.strip():
        console.print("[red]Error: Task title cannot be empty[/red]")
        return

    # Get description (optional)
    description = Prompt.ask(
        "[yellow]Enter description (optional, press Enter to skip)[/yellow]",
        default="",
    )
    description = description if description.strip() else None

    # Get priority
    priority_str = Prompt.ask(
        "[yellow]Enter priority (low/medium/high)[/yellow]",
        default="medium",
        choices=["low", "medium", "high"],
    )
    priority = Priority(priority_str)

    # Get due date (optional)
    due_date: Optional[datetime] = None
    due_date_str = Prompt.ask(
        "[yellow]Enter due date (YYYY-MM-DD, optional)[/yellow]",
        default="",
    )
    if due_date_str.strip():
        try:
            due_date = datetime.strptime(due_date_str.strip(), "%Y-%m-%d")
        except ValueError:
            console.print("[yellow]Invalid date format, skipping due date[/yellow]")

    # Get recurrence pattern (optional, requires due date)
    recurrence: Optional[RecurrencePattern] = None
    recurrence_end_date: Optional[datetime] = None
    reminder_offset: Optional[ReminderOffset] = None

    if due_date:
        recurrence_str = Prompt.ask(
            "[yellow]Enter recurrence (none/daily/weekly/monthly)[/yellow]",
            default="none",
            choices=["none", "daily", "weekly", "monthly"],
        )
        if recurrence_str != "none":
            recurrence = RecurrencePattern(recurrence_str)

            # Get recurrence end date (optional)
            end_date_str = Prompt.ask(
                "[yellow]Enter recurrence end date (YYYY-MM-DD, optional)[/yellow]",
                default="",
            )
            if end_date_str.strip():
                try:
                    recurrence_end_date = datetime.strptime(end_date_str.strip(), "%Y-%m-%d")
                    if recurrence_end_date < due_date:
                        console.print("[yellow]End date must be after due date, skipping[/yellow]")
                        recurrence_end_date = None
                except ValueError:
                    console.print("[yellow]Invalid date format, skipping end date[/yellow]")

        # Get reminder offset
        reminder_choice = Prompt.ask(
            "[yellow]Set reminder?[/yellow]",
            default="none",
            choices=["none", "at_time", "15m", "1h", "1d"],
        )
        reminder_map = {
            "at_time": ReminderOffset.AT_DUE_TIME,
            "15m": ReminderOffset.FIFTEEN_MIN_BEFORE,
            "1h": ReminderOffset.ONE_HOUR_BEFORE,
            "1d": ReminderOffset.ONE_DAY_BEFORE,
        }
        if reminder_choice != "none":
            reminder_offset = reminder_map[reminder_choice]

    try:
        task = store.add(
            title=title,
            description=description,
            priority=priority,
            due_date=due_date,
            recurrence=recurrence,
            recurrence_end_date=recurrence_end_date,
            reminder_offset=reminder_offset,
        )
        console.print(f"\n[green]Task created successfully![/green]")
        console.print(f"[white]ID: {task.id}[/white]")
        console.print(f"[white]Title: {task.title}[/white]")
        console.print(f"[white]Priority: {task.priority.value}[/white]")
        if task.recurrence:
            console.print(f"[white]Recurrence: {task.recurrence.value}[/white]")
    except ValueError as e:
        console.print(f"[red]Error: {e}[/red]")


def list_tasks() -> None:
    """Display all tasks in a Rich table, applying active filters."""
    tasks = store.list_all()

    # Apply active filters if any
    active_filters = store.get_active_filters()
    if active_filters:
        tasks = store.filter_tasks(
            tasks=tasks,
            status=active_filters.get("status"),
            priority=active_filters.get("priority"),
            due_date_filter=active_filters.get("due_date_filter"),
        )

    if not tasks:
        if active_filters:
            console.print("\n[yellow]No tasks match the current filters.[/yellow]\n")
        else:
            console.print("\n[yellow]No tasks yet. Add your first task![/yellow]\n")
        return

    # Build table title with filter indicator
    title = "Tasks"
    if active_filters:
        filter_info = ", ".join(f"{k}={v.value if hasattr(v, 'value') else v}" for k, v in active_filters.items())
        title += f" [dim](filtered: {filter_info})[/dim]"

    table = Table(title=title, show_header=True, header_style="bold cyan")
    table.add_column("ID", style="dim", width=6)
    table.add_column("Title", min_width=20)
    table.add_column("Priority", width=10)
    table.add_column("Status", width=12)
    table.add_column("Due Date", width=12)

    for task in tasks:
        status_styles = {
            TaskStatus.PENDING: "[yellow]Pending[/yellow]",
            TaskStatus.IN_PROGRESS: "[cyan]In Progress[/cyan]",
            TaskStatus.COMPLETED: "[green]Done[/green]",
        }
        status = status_styles.get(task.status, "[yellow]Pending[/yellow]")

        # Format due date with recurrence and overdue indicators
        if task.due_date:
            due_str = task.due_date.strftime("%Y-%m-%d")
            if task.is_overdue:
                due_str = f"[bold red]{due_str}[/bold red]"
            if task.recurrence:
                due_str += " [magenta]🔄[/magenta]"
        else:
            due_str = "-"

        priority_color = {
            Priority.LOW: "blue",
            Priority.MEDIUM: "yellow",
            Priority.HIGH: "red",
        }
        priority_styled = f"[{priority_color[task.priority]}]{task.priority.value}[/{priority_color[task.priority]}]"

        # Highlight title if overdue
        title_styled = f"[bold red]{task.title}[/bold red]" if task.is_overdue else task.title

        table.add_row(
            str(task.id),
            title_styled,
            priority_styled,
            status,
            due_str,
        )

    console.print()
    console.print(table)

    counts = store.count_by_status()
    progress = store.get_progress()
    console.print(
        f"\n[dim]Tasks: {counts['total']} total | "
        f"{counts[TaskStatus.PENDING.value]} pending, "
        f"{counts[TaskStatus.IN_PROGRESS.value]} in-progress, "
        f"{counts[TaskStatus.COMPLETED.value]} completed | "
        f"Progress: {progress:.1f}%[/dim]\n"
    )


def update_task() -> None:
    """Handle updating an existing task."""
    console.print("\n[bold cyan]Update Task[/bold cyan]\n")

    task_id_str = Prompt.ask("[yellow]Enter task ID to update[/yellow]")
    try:
        task_id = int(task_id_str)
    except ValueError:
        console.print("[red]Error: Invalid task ID[/red]")
        return

    task = store.get(task_id)
    if task is None:
        console.print(f"[red]Error: Task with ID {task_id} not found[/red]")
        return

    console.print(f"[dim]Current title: {task.title}[/dim]")
    new_title = Prompt.ask(
        "[yellow]Enter new title (press Enter to keep current)[/yellow]",
        default="",
    )

    if new_title.strip():
        try:
            store.update(task_id, title=new_title)
            console.print("[green]Updated successfully![/green]")
        except ValueError as e:
            console.print(f"[red]Error: {e}[/red]")
    else:
        console.print("[dim]No changes made[/dim]")


def delete_task() -> None:
    """Handle deleting a task with confirmation."""
    console.print("\n[bold cyan]Delete Task[/bold cyan]\n")

    task_id_str = Prompt.ask("[yellow]Enter task ID to delete[/yellow]")
    try:
        task_id = int(task_id_str)
    except ValueError:
        console.print("[red]Error: Invalid task ID[/red]")
        return

    task = store.get(task_id)
    if task is None:
        console.print(f"[red]Error: Task with ID {task_id} not found[/red]")
        return

    if Confirm.ask(f'Are you sure you want to delete "[bold]{task.title}[/bold]"?'):
        store.delete(task_id)
        console.print("[green]Task deleted successfully[/green]")
    else:
        console.print("[dim]Deletion cancelled[/dim]")


def complete_task() -> None:
    """Handle marking a task as complete with toggle support."""
    console.print("\n[bold cyan]Complete Task[/bold cyan]\n")

    task_id_str = Prompt.ask("[yellow]Enter task ID to complete[/yellow]")
    try:
        task_id = int(task_id_str)
    except ValueError:
        console.print("[red]Error: Invalid task ID[/red]")
        return

    task = store.get(task_id)
    if task is None:
        console.print(f"[red]Error: Task with ID {task_id} not found[/red]")
        return

    if task.status == TaskStatus.COMPLETED:
        if Confirm.ask(
            f'Task "[bold]{task.title}[/bold]" is already complete. Mark as incomplete?'
        ):
            store.uncomplete(task_id)
            console.print("[green]Task marked as incomplete[/green]")
    else:
        completed_task, new_task = store.complete(task_id)
        console.print(f'[green]Task "[bold]{task.title}[/bold]" marked as complete![/green]')
        if new_task:
            console.print(
                f"[cyan]Recurring task created: ID {new_task.id}, "
                f"due {new_task.due_date.strftime('%Y-%m-%d') if new_task.due_date else 'N/A'}[/cyan]"
            )


def mark_in_progress() -> None:
    """Handle marking a task as in progress."""
    console.print("\n[bold cyan]Mark In Progress[/bold cyan]\n")

    task_id_str = Prompt.ask("[yellow]Enter task ID to mark as in progress[/yellow]")
    try:
        task_id = int(task_id_str)
    except ValueError:
        console.print("[red]Error: Invalid task ID[/red]")
        return

    task = store.get(task_id)
    if task is None:
        console.print(f"[red]Error: Task with ID {task_id} not found[/red]")
        return

    if task.status == TaskStatus.IN_PROGRESS:
        console.print(f'[yellow]Task "[bold]{task.title}[/bold]" is already in progress[/yellow]')
    else:
        store.mark_in_progress(task_id)
        console.print(f'[green]Task "[bold]{task.title}[/bold]" marked as in progress![/green]')


def search_menu() -> None:
    """Display search submenu and handle search operations."""
    console.print("\n[bold cyan]Search Tasks[/bold cyan]\n")

    search_options = """
[bold cyan]1.[/bold cyan] Search by ID
[bold cyan]2.[/bold cyan] Search by Keyword
[bold cyan]3.[/bold cyan] Back to Main Menu
"""
    console.print(Panel(search_options, title="Search Options", border_style="cyan"))

    choice = Prompt.ask(
        "[yellow]Enter choice (1-3)[/yellow]",
        choices=["1", "2", "3"],
        show_choices=False,
    )

    if choice == "1":
        search_by_id_handler()
    elif choice == "2":
        search_by_keyword_handler()
    # choice == "3" returns to main menu


def search_by_id_handler() -> None:
    """Handle search by task ID."""
    task_id_str = Prompt.ask("[yellow]Enter task ID to find[/yellow]")
    try:
        task_id = int(task_id_str)
    except ValueError:
        console.print("[red]Error: Invalid task ID[/red]")
        return

    task = store.get(task_id)
    if task is None:
        console.print(f"[yellow]No task found with ID {task_id}[/yellow]")
        return

    # Display task details
    table = Table(title=f"Task #{task_id}", show_header=True, header_style="bold cyan")
    table.add_column("Field", style="cyan", width=15)
    table.add_column("Value", min_width=30)

    status_styles = {
        TaskStatus.PENDING: "[yellow]Pending[/yellow]",
        TaskStatus.IN_PROGRESS: "[cyan]In Progress[/cyan]",
        TaskStatus.COMPLETED: "[green]Done[/green]",
    }

    table.add_row("ID", str(task.id))
    table.add_row("Title", task.title)
    table.add_row("Description", task.description or "-")
    table.add_row("Status", status_styles.get(task.status, str(task.status)))
    table.add_row("Priority", task.priority.value)
    table.add_row("Due Date", task.due_date.strftime("%Y-%m-%d") if task.due_date else "-")
    table.add_row("Created", task.created_at.strftime("%Y-%m-%d %H:%M"))

    console.print()
    console.print(table)


def search_by_keyword_handler() -> None:
    """Handle search by keyword with highlighted results."""
    keyword = Prompt.ask("[yellow]Enter search keyword[/yellow]")
    if not keyword.strip():
        console.print("[red]Error: Search keyword cannot be empty[/red]")
        return

    results = store.search_by_keyword(keyword)

    if not results:
        console.print(f"\n[yellow]No tasks found matching '{keyword}'[/yellow]\n")
        return

    table = Table(
        title=f"Search Results for '{keyword}'",
        show_header=True,
        header_style="bold cyan",
    )
    table.add_column("ID", style="dim", width=6)
    table.add_column("Title", min_width=20)
    table.add_column("Description", min_width=20)
    table.add_column("Status", width=12)

    for task in results:
        # Highlight keyword in title and description
        title = highlight_keyword(task.title, keyword)
        description = highlight_keyword(task.description or "-", keyword) if task.description else "-"

        status_styles = {
            TaskStatus.PENDING: "[yellow]Pending[/yellow]",
            TaskStatus.IN_PROGRESS: "[cyan]In Progress[/cyan]",
            TaskStatus.COMPLETED: "[green]Done[/green]",
        }
        status = status_styles.get(task.status, str(task.status))

        table.add_row(str(task.id), title, description, status)

    console.print()
    console.print(table)
    console.print(f"\n[dim]Found {len(results)} matching task(s)[/dim]\n")


def highlight_keyword(text: str, keyword: str) -> str:
    """Highlight keyword in text (case-insensitive)."""
    import re
    pattern = re.compile(re.escape(keyword), re.IGNORECASE)
    return pattern.sub(f"[bold magenta]{keyword}[/bold magenta]", text)


def filter_menu() -> None:
    """Display filter submenu and handle filter operations."""
    console.print("\n[bold cyan]Filter Tasks[/bold cyan]\n")

    # Show current filters
    active = store.get_active_filters()
    if active:
        filter_info = ", ".join(f"{k}={v.value if hasattr(v, 'value') else v}" for k, v in active.items())
        console.print(f"[dim]Current filters: {filter_info}[/dim]\n")
    else:
        console.print("[dim]No active filters[/dim]\n")

    filter_options = """
[bold cyan]1.[/bold cyan] Filter by Status
[bold cyan]2.[/bold cyan] Filter by Priority
[bold cyan]3.[/bold cyan] Filter by Due Date
[bold cyan]4.[/bold cyan] Clear All Filters
[bold cyan]5.[/bold cyan] Back to Main Menu
"""
    console.print(Panel(filter_options, title="Filter Options", border_style="cyan"))

    choice = Prompt.ask(
        "[yellow]Enter choice (1-5)[/yellow]",
        choices=["1", "2", "3", "4", "5"],
        show_choices=False,
    )

    if choice == "1":
        filter_by_status_handler()
    elif choice == "2":
        filter_by_priority_handler()
    elif choice == "3":
        filter_by_due_date_handler()
    elif choice == "4":
        store.clear_filters()
        console.print("[green]All filters cleared[/green]")
    # choice == "5" returns to main menu


def filter_by_status_handler() -> None:
    """Handle filtering by task status."""
    console.print("\n[bold]Select Status:[/bold]")
    console.print("1. Pending")
    console.print("2. In Progress")
    console.print("3. Completed")
    console.print("4. Clear status filter")

    choice = Prompt.ask(
        "[yellow]Enter choice (1-4)[/yellow]",
        choices=["1", "2", "3", "4"],
        show_choices=False,
    )

    status_map = {
        "1": TaskStatus.PENDING,
        "2": TaskStatus.IN_PROGRESS,
        "3": TaskStatus.COMPLETED,
    }

    if choice == "4":
        store.set_filter(status=None)
        console.print("[green]Status filter cleared[/green]")
    else:
        status = status_map[choice]
        store.set_filter(status=status)
        console.print(f"[green]Filter set: status = {status.value}[/green]")


def filter_by_priority_handler() -> None:
    """Handle filtering by task priority."""
    console.print("\n[bold]Select Priority:[/bold]")
    console.print("1. Low")
    console.print("2. Medium")
    console.print("3. High")
    console.print("4. Clear priority filter")

    choice = Prompt.ask(
        "[yellow]Enter choice (1-4)[/yellow]",
        choices=["1", "2", "3", "4"],
        show_choices=False,
    )

    priority_map = {
        "1": Priority.LOW,
        "2": Priority.MEDIUM,
        "3": Priority.HIGH,
    }

    if choice == "4":
        store.set_filter(priority=None)
        console.print("[green]Priority filter cleared[/green]")
    else:
        priority = priority_map[choice]
        store.set_filter(priority=priority)
        console.print(f"[green]Filter set: priority = {priority.value}[/green]")


def filter_by_due_date_handler() -> None:
    """Handle filtering by due date."""
    console.print("\n[bold]Select Due Date Filter:[/bold]")
    console.print("1. Today")
    console.print("2. This Week")
    console.print("3. Overdue")
    console.print("4. No Due Date")
    console.print("5. Clear due date filter")

    choice = Prompt.ask(
        "[yellow]Enter choice (1-5)[/yellow]",
        choices=["1", "2", "3", "4", "5"],
        show_choices=False,
    )

    filter_map = {
        "1": DueDateFilter.TODAY,
        "2": DueDateFilter.THIS_WEEK,
        "3": DueDateFilter.OVERDUE,
        "4": DueDateFilter.NO_DUE_DATE,
    }

    if choice == "5":
        store.set_filter(due_date_filter=None)
        console.print("[green]Due date filter cleared[/green]")
    else:
        due_filter = filter_map[choice]
        store.set_filter(due_date_filter=due_filter)
        console.print(f"[green]Filter set: due date = {due_filter.value}[/green]")


def sort_menu() -> None:
    """Display sort submenu and handle sort operations."""
    console.print("\n[bold cyan]Sort Tasks[/bold cyan]\n")

    # Show current sort
    sort_key, descending = store.get_current_sort()
    direction = "descending" if descending else "ascending"
    console.print(f"[dim]Current sort: {sort_key.value} ({direction})[/dim]\n")

    sort_options = """
[bold cyan]1.[/bold cyan] Sort by Priority
[bold cyan]2.[/bold cyan] Sort by Due Date
[bold cyan]3.[/bold cyan] Sort by Created Date
[bold cyan]4.[/bold cyan] Toggle Direction
[bold cyan]5.[/bold cyan] Back to Main Menu
"""
    console.print(Panel(sort_options, title="Sort Options", border_style="cyan"))

    choice = Prompt.ask(
        "[yellow]Enter choice (1-5)[/yellow]",
        choices=["1", "2", "3", "4", "5"],
        show_choices=False,
    )

    if choice == "1":
        store.set_sort(SortKey.PRIORITY, store.get_current_sort()[1])
        console.print("[green]Sort set: by priority[/green]")
    elif choice == "2":
        store.set_sort(SortKey.DUE_DATE, store.get_current_sort()[1])
        console.print("[green]Sort set: by due date[/green]")
    elif choice == "3":
        store.set_sort(SortKey.CREATED_AT, store.get_current_sort()[1])
        console.print("[green]Sort set: by created date[/green]")
    elif choice == "4":
        current_key, current_desc = store.get_current_sort()
        new_direction = not current_desc
        store.set_sort(current_key, new_direction)
        direction_str = "descending" if new_direction else "ascending"
        console.print(f"[green]Sort direction changed to: {direction_str}[/green]")
    # choice == "5" returns to main menu


# Calendar view state
_calendar_current_date: date = date.today()


def calendar_menu() -> None:
    """Display calendar view submenu and handle calendar operations."""
    global _calendar_current_date
    console.print("\n[bold cyan]Calendar Views[/bold cyan]\n")

    calendar_options = """
[bold cyan]1.[/bold cyan] Daily View
[bold cyan]2.[/bold cyan] Weekly View
[bold cyan]3.[/bold cyan] Previous Day/Week
[bold cyan]4.[/bold cyan] Next Day/Week
[bold cyan]5.[/bold cyan] Go to Today
[bold cyan]6.[/bold cyan] Back to Main Menu
"""
    console.print(Panel(calendar_options, title="Calendar Options", border_style="cyan"))

    choice = Prompt.ask(
        "[yellow]Enter choice (1-6)[/yellow]",
        choices=["1", "2", "3", "4", "5", "6"],
        show_choices=False,
    )

    if choice == "1":
        daily_view_handler()
    elif choice == "2":
        weekly_view_handler()
    elif choice == "3":
        _calendar_current_date -= timedelta(days=1)
        console.print(f"[green]Moved to: {_calendar_current_date.strftime('%Y-%m-%d')}[/green]")
    elif choice == "4":
        _calendar_current_date += timedelta(days=1)
        console.print(f"[green]Moved to: {_calendar_current_date.strftime('%Y-%m-%d')}[/green]")
    elif choice == "5":
        _calendar_current_date = date.today()
        console.print("[green]Reset to today[/green]")
    # choice == "6" returns to main menu


def daily_view_handler() -> None:
    """Display daily view with tasks for the current date."""
    global _calendar_current_date
    from datetime import date as date_type

    tasks = store.get_daily_tasks(_calendar_current_date)

    # Format date string
    date_str = _calendar_current_date.strftime("%A, %B %d, %Y")
    is_today = _calendar_current_date == date_type.today()
    today_indicator = " [cyan](Today)[/cyan]" if is_today else ""

    # Build content
    if tasks:
        content_lines = []
        for task in tasks:
            status_icon = {
                TaskStatus.PENDING: "[yellow]○[/yellow]",
                TaskStatus.IN_PROGRESS: "[cyan]◐[/cyan]",
                TaskStatus.COMPLETED: "[green]●[/green]",
            }.get(task.status, "○")

            priority_color = {
                Priority.LOW: "blue",
                Priority.MEDIUM: "yellow",
                Priority.HIGH: "red",
            }[task.priority]

            recurrence_icon = " [magenta]🔄[/magenta]" if task.recurrence else ""
            content_lines.append(
                f"{status_icon} [{priority_color}]{task.title}[/{priority_color}]{recurrence_icon}"
            )
        content = "\n".join(content_lines)
    else:
        content = "[dim]No tasks scheduled for this day[/dim]"

    panel = Panel(
        content,
        title=f"[bold white]{date_str}[/bold white]{today_indicator}",
        border_style="cyan",
        padding=(1, 2),
    )
    console.print()
    console.print(panel)
    console.print(f"\n[dim]{len(tasks)} task(s) | Use options 3/4 to navigate[/dim]")


def weekly_view_handler() -> None:
    """Display weekly view with tasks grouped by day."""
    global _calendar_current_date
    from datetime import date as date_type

    week_start = store.get_week_start(_calendar_current_date)
    grouped_tasks = store.get_weekly_tasks_grouped(week_start)

    week_end = week_start + timedelta(days=6)
    week_str = f"{week_start.strftime('%b %d')} - {week_end.strftime('%b %d, %Y')}"

    table = Table(
        title=f"[bold white]Week of {week_str}[/bold white]",
        show_header=True,
        header_style="bold cyan",
    )
    table.add_column("Day", width=12)
    table.add_column("Date", width=10)
    table.add_column("Tasks", min_width=30)

    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    for i, (day_date, tasks) in enumerate(sorted(grouped_tasks.items())):
        day_name = day_names[i]
        date_str = day_date.strftime("%m-%d")

        # Highlight today
        is_today = day_date == date_type.today()
        if is_today:
            day_name = f"[cyan]{day_name}[/cyan]"
            date_str = f"[cyan]{date_str}[/cyan]"

        if tasks:
            task_summaries = []
            for task in tasks:
                status_icon = {
                    TaskStatus.PENDING: "○",
                    TaskStatus.IN_PROGRESS: "◐",
                    TaskStatus.COMPLETED: "●",
                }.get(task.status, "○")
                task_summaries.append(f"{status_icon} {task.title[:25]}{'...' if len(task.title) > 25 else ''}")
            task_str = "\n".join(task_summaries)
        else:
            task_str = "[dim]-[/dim]"

        table.add_row(day_name, date_str, task_str)

    console.print()
    console.print(table)

    total_tasks = sum(len(tasks) for tasks in grouped_tasks.values())
    console.print(f"\n[dim]{total_tasks} total task(s) this week[/dim]")


def reminders_menu() -> None:
    """Display reminder management submenu and handle reminder operations."""
    console.print("\n[bold cyan]Reminder Management[/bold cyan]\n")

    reminder_options = """
[bold cyan]1.[/bold cyan] View Upcoming Reminders
[bold cyan]2.[/bold cyan] Set/Update Reminder
[bold cyan]3.[/bold cyan] Remove Reminder
[bold cyan]4.[/bold cyan] Back to Main Menu
"""
    console.print(Panel(reminder_options, title="Reminder Options", border_style="cyan"))

    choice = Prompt.ask(
        "[yellow]Enter choice (1-4)[/yellow]",
        choices=["1", "2", "3", "4"],
        show_choices=False,
    )

    if choice == "1":
        view_reminders_handler()
    elif choice == "2":
        set_reminder_handler()
    elif choice == "3":
        remove_reminder_handler()
    # choice == "4" returns to main menu


def view_reminders_handler() -> None:
    """Display all upcoming reminders."""
    reminders = store.get_upcoming_reminders()

    if not reminders:
        console.print("\n[yellow]No upcoming reminders set.[/yellow]\n")
        return

    table = Table(title="Upcoming Reminders", show_header=True, header_style="bold cyan")
    table.add_column("Task ID", style="dim", width=8)
    table.add_column("Task Title", min_width=20)
    table.add_column("Due Date", width=12)
    table.add_column("Reminder Time", width=17)

    for task in reminders:
        reminder_time = task.reminder_time
        time_str = reminder_time.strftime("%m-%d %H:%M") if reminder_time else "-"
        due_str = task.due_date.strftime("%Y-%m-%d") if task.due_date else "-"

        table.add_row(str(task.id), task.title, due_str, time_str)

    console.print()
    console.print(table)


def set_reminder_handler() -> None:
    """Handle setting/updating a reminder for a task."""
    task_id_str = Prompt.ask("[yellow]Enter task ID to set reminder for[/yellow]")
    try:
        task_id = int(task_id_str)
    except ValueError:
        console.print("[red]Error: Invalid task ID[/red]")
        return

    task = store.get(task_id)
    if not task:
        console.print(f"[red]Error: Task with ID {task_id} not found[/red]")
        return

    if not task.due_date:
        console.print("[red]Error: Reminder requires a task with a due date[/red]")
        return

    reminder_choice = Prompt.ask(
        "[yellow]Select reminder time[/yellow]",
        choices=["at_time", "15m", "1h", "1d"],
    )
    reminder_map = {
        "at_time": ReminderOffset.AT_DUE_TIME,
        "15m": ReminderOffset.FIFTEEN_MIN_BEFORE,
        "1h": ReminderOffset.ONE_HOUR_BEFORE,
        "1d": ReminderOffset.ONE_DAY_BEFORE,
    }

    store.update(task_id, reminder_offset=reminder_map[reminder_choice])
    console.print(f"[green]Reminder set for task {task_id}[/green]")


def remove_reminder_handler() -> None:
    """Handle removing a reminder from a task."""
    task_id_str = Prompt.ask("[yellow]Enter task ID to remove reminder from[/yellow]")
    try:
        task_id = int(task_id_str)
    except ValueError:
        console.print("[red]Error: Invalid task ID[/red]")
        return

    task = store.get(task_id)
    if not task:
        console.print(f"[red]Error: Task with ID {task_id} not found[/red]")
        return

    store.update(task_id, reminder_offset=None)
    console.print(f"[green]Reminder removed from task {task_id}[/green]")


def check_and_display_reminders() -> None:
    """Check for due reminders and display notifications."""
    triggered = store.check_reminders()
    for task in triggered:
        display_reminder(task)
        store.mark_reminder_shown(task.id)


def display_reminder(task: Task) -> None:
    """Display a reminder notification."""
    msg = f"[bold yellow]REMINDER:[/bold yellow] [white]{task.title}[/white] is due soon!"
    if task.due_date:
        msg += f"\nDue: [dim]{task.due_date.strftime('%Y-%m-%d %H:%M')}[/dim]"

    panel = Panel(msg, title="Notification", border_style="yellow", padding=(1, 2))
    console.print()
    console.print(panel)
    console.print()


def main() -> None:
    """Main entry point for the CLI application."""
    console.print(
        "\n[bold cyan]Welcome to Todo Evolution - Phase I Console App[/bold cyan]\n"
    )

    while True:
        # Check reminders before each menu iteration
        check_and_display_reminders()

        display_menu()

        choice = Prompt.ask(
            "[yellow]Enter choice (0-9, c=Calendar, r=Reminders)[/yellow]",
            choices=["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "c", "r"],
            show_choices=False,
        )

        if choice == "1":
            add_task()
        elif choice == "2":
            list_tasks()
        elif choice == "3":
            update_task()
        elif choice == "4":
            delete_task()
        elif choice == "5":
            complete_task()
        elif choice == "6":
            mark_in_progress()
        elif choice == "7":
            search_menu()
        elif choice == "8":
            filter_menu()
        elif choice == "9":
            sort_menu()
        elif choice == "c":
            calendar_menu()
        elif choice == "r":
            reminders_menu()
        elif choice == "0":
            console.print("\n[cyan]Goodbye![/cyan]\n")
            sys.exit(0)

        console.print()  # Add spacing between operations


if __name__ == "__main__":
    main()
