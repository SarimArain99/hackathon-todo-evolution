"""
Recurrence Service - RRULE validation and next instance calculation.

Handles recurring task automation:
- Validate RRULE format (iCal RFC 5545)
- Calculate next occurrence date
- Generate next instance data

RRULE Examples:
- Daily: FREQ=DAILY
- Weekly: FREQ=WEEKLY;BYDAY=FR
- Monthly: FREQ=MONTHLY;BYMONTHDAY=15
- Weekdays: FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Optional

from dateutil import rrule
from dateutil.relativedelta import relativedelta
from pydantic import ValidationError

from app.models import Task
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class RecurrenceService:
    """
    Service for handling recurring task logic.

    Uses dateutil.rrule for RRULE parsing and calculation.
    Handles edge cases like Feb 30, end-of-month, etc.
    """

    # Common RRULE templates for user selection
    RRULE_TEMPLATES = {
        "daily": "FREQ=DAILY",
        "weekly": "FREQ=WEEKLY",
        "monthly": "FREQ=MONTHLY",
        "yearly": "FREQ=YEARLY",
        "weekdays": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
        "weekends": "FREQ=WEEKLY;BYDAY=SA,SU",
    }

    @staticmethod
    def validate_recurrence(rrule_str: Optional[str], due_date: Optional[datetime]) -> bool:
        """
        Validate RRULE format and check it generates future dates.

        Args:
            rrule_str: RRULE string to validate
            due_date: Optional due_date to use as start date (defaults to now)

        Returns:
            True if RRULE is valid and generates future dates

        Raises:
            ValueError: If RRULE is invalid or doesn't generate future dates
        """
        if not rrule_str:
            return True  # Empty RRULE is valid (no recurrence)

        try:
            # Parse RRULE to verify format
            rule_set = rrule.rrulestr(rrule_str)

            # Set start date
            start = due_date or datetime.utcnow()

            # Get next occurrence
            rule_set.dtstart = start
            next_occurrences = list(rule_set.xafter(start, count=1))

            if not next_occurrences:
                raise ValueError("RRULE does not generate any future dates")

            # Check next occurrence is actually in the future
            next_date = next_occurrences[0]
            if next_date <= start:
                raise ValueError("RRULE must generate future dates")

            return True

        except ValueError as e:
            raise ValueError(f"Invalid recurrence rule: {e}")
        except Exception as e:
            raise ValueError(f"Failed to parse RRULE: {e}")

    @staticmethod
    def get_next_occurrence(
        rrule_str: str,
        start_date: datetime,
    ) -> Optional[datetime]:
        """
        Calculate next occurrence based on RRULE.

        Args:
            rrule_str: Valid RRULE string
            start_date: Start date for calculation

        Returns:
            Next occurrence datetime, or None if no future occurrences
        """
        try:
            rule_set = rrule.rrulestr(rrule_str)
            rule_set.dtstart = start_date

            # Get next occurrence after start_date
            next_occurrences = list(rule_set.xafter(start_date, count=1))

            if next_occurrences:
                return next_occurrences[0]

            return None

        except Exception as e:
            logger.error(f"Failed to calculate next occurrence: {e}")
            return None

    @staticmethod
    def create_next_instance_from_event(
        session: AsyncSession,
        task_id: int,
        user_id: str,
    ) -> Optional[dict[str, Any]]:
        """
        Create next instance data for a recurring task.

        Called when a recurring task is completed via event subscription.
        Reads the parent task and generates next instance data.

        Args:
            session: Database session
            task_id: ID of the completed task
            user_id: User ID for access control

        Returns:
            Dictionary with next instance data, or None if:
            - Task not found
            - Task is not recurring
            - No next occurrence (RRULE exhausted)
        """
        from sqlmodel import select

        # Get the original task (using sync get in async context)
        task = session.get(Task, task_id)
        if not task or task.user_id != user_id:
            return None

        recurrence_rule = task.recurrence_rule
        if not recurrence_rule:
            return None  # Not a recurring task

        # Calculate next occurrence
        start_date = task.due_date or task.created_at
        next_due = RecurrenceService.get_next_occurrence(recurrence_rule, start_date)

        if not next_due:
            return None  # No more occurrences

        # Build next instance data
        return {
            "user_id": user_id,
            "title": task.title,
            "description": task.description,
            "priority": task.priority,
            "due_date": next_due,
            "reminder_at": None,  # Reset reminder for new instance
            "tags": task.tags,
            "recurrence_rule": None,  # Instances don't repeat
            "parent_task_id": task_id,  # Reference to original task
            "completed": False,
        }

    @staticmethod
    def build_rrule(
        frequency: str,
        interval: int = 1,
        by_day: Optional[list[str]] = None,
        by_month_day: Optional[int] = None,
        until: Optional[datetime] = None,
        count: Optional[int] = None,
    ) -> str:
        """
        Build RRULE string from parameters (for UI helpers).

        Args:
            frequency: FREQ value (DAILY, WEEKLY, MONTHLY, YEARLY)
            interval: Every N periods (default 1)
            by_day: Days of week for weekly (MO, TU, WE, TH, FR, SA, SU)
            by_month_day: Day of month for monthly (1-31)
            until: End date for recurrence
            count: Maximum number of occurrences

        Returns:
            Valid RRULE string
        """
        parts = [f"FREQ={frequency.upper()}", f"INTERVAL={interval}"]

        if by_day:
            parts.append(f"BYDAY={','.join(by_day)}")

        if by_month_day:
            parts.append(f"BYMONTHDAY={by_month_day}")

        if until:
            parts.append(f"UNTIL={until.strftime('%Y%m%dT%H%M%SZ')}")

        if count:
            parts.append(f"COUNT={count}")

        return ";".join(parts)

    @staticmethod
    def explain_rrule(rrule_str: str) -> str:
        """
        Generate human-readable explanation of RRULE.

        Args:
            rrule_str: RRULE string to explain

        Returns:
            Human-readable description
        """
        try:
            rule_set = rrule.rrulestr(rrule_str)

            # Extract frequency
            freq_map = {
                rrule.DAILY: "day",
                rrule.WEEKLY: "week",
                rrule.MONTHLY: "month",
                rrule.YEARLY: "year",
            }

            freq = freq_map.get(rule_set._freq, "period")

            interval = rule_set._interval
            if interval == 1:
                frequency_text = f"every {freq}"
            else:
                frequency_text = f"every {interval} {freq}s"

            return f"This task repeats {frequency_text}"

        except Exception:
            return "Custom recurrence"


# =============================================================================
# RRULE Template Helpers for Frontend
# =============================================================================

RECURRENCE_OPTIONS = [
    {
        "value": "",
        "label": "Does not repeat",
        "rrule": None,
    },
    {
        "value": "daily",
        "label": "Daily",
        "rrule": "FREQ=DAILY",
    },
    {
        "value": "weekly",
        "label": "Weekly",
        "rrule": "FREQ=WEEKLY",
    },
    {
        "value": "weekdays",
        "label": "Weekdays (Mon-Fri)",
        "rrule": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    },
    {
        "value": "monthly",
        "label": "Monthly",
        "rrule": "FREQ=MONTHLY",
    },
]
