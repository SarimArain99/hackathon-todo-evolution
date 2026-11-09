/**
 * Date helpers for task due dates.
 *
 * Due dates are date-only values (the form sends "YYYY-MM-DD"), stored and
 * returned by the API as a timestamp. A task is only overdue when its due
 * day is strictly before today — a task due today is due today, not
 * overdue, even late in the day.
 *
 * The comparison is done on calendar days in the viewer's local timezone
 * (the user's browser timezone), so a date-only due date of today is
 * never treated as past just because midnight has passed.
 */
export function isTaskOverdue(
  dueDate: string | null | undefined,
  completed: boolean
): boolean {
  if (!dueDate || completed) return false;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return due < startOfToday;
}
