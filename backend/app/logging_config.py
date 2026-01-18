"""
Structured logging configuration for Hackathon Todo Evolution Backend.

Uses structlog for JSON-formatted logs in production and pretty logs in development.
"""

import logging
import os
from typing import Any

import structlog


def configure_logging() -> None:
    """Configure structured logging for the application."""
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    environment = os.getenv("ENVIRONMENT", "development")

    # Configure structlog
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if environment == "production":
        # JSON output for production
        structlog.configure(
            processors=[
                *shared_processors,
                structlog.processors.JSONRenderer(),
            ],
            wrapper_class=structlog.stdlib.BoundLogger,
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )
        logging.basicConfig(
            format="%(message)s",
            level=getattr(logging, log_level, logging.INFO),
        )
    else:
        # Pretty console output for development
        structlog.configure(
            processors=[
                *shared_processors,
                structlog.dev.ConsoleRenderer(
                    colors=True,
                    exception_formatter=structlog.dev.plain_traceback,
                ),
            ],
            wrapper_class=structlog.stdlib.BoundLogger,
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )
        logging.basicConfig(
            format="%(message)s",
            level=getattr(logging, log_level, logging.INFO),
        )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance.

    Args:
        name: Logger name (usually __name__ of the module)

    Returns:
        Configured structlog logger
    """
    return structlog.get_logger(name)


class LoggerMixin:
    """Mixin class to add logging capability to any class."""

    @property
    def logger(self) -> structlog.stdlib.BoundLogger:
        """Get a logger for this class."""
        return get_logger(self.__class__.__name__)


def log_request(request_id: str, method: str, path: str, **kwargs: Any) -> None:
    """Log an incoming request.

    Args:
        request_id: Unique request identifier
        method: HTTP method
        path: Request path
        **kwargs: Additional context to log
    """
    log = get_logger("api.request")
    log.info(
        "incoming_request",
        request_id=request_id,
        method=method,
        path=path,
        **kwargs,
    )


def log_response(request_id: str, status_code: int, **kwargs: Any) -> None:
    """Log a response.

    Args:
        request_id: Unique request identifier
        status_code: HTTP status code
        **kwargs: Additional context to log
    """
    log = get_logger("api.response")
    log.info(
        "outgoing_response",
        request_id=request_id,
        status_code=status_code,
        **kwargs,
    )


def log_error(request_id: str, error: Exception, **kwargs: Any) -> None:
    """Log an error.

    Args:
        request_id: Unique request identifier
        error: The exception that occurred
        **kwargs: Additional context to log
    """
    log = get_logger("api.error")
    log.error(
        "request_error",
        request_id=request_id,
        error_type=type(error).__name__,
        error_message=str(error),
        exc_info=error,
        **kwargs,
    )


# Configure logging on module import
configure_logging()
