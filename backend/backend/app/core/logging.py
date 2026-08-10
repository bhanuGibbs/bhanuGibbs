from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler

from app.core.config import get_settings

settings = get_settings()

LOG_FORMAT = (
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
LOG_FILE = "logs/backend.log"
LOG_MAX_BYTES = 10 * 1024 * 1024
LOG_BACKUP_COUNT = 5


def configure_logging() -> None:
    """Configure global logging for the application."""
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG if settings.debug else logging.INFO)

    formatter = logging.Formatter(fmt=LOG_FORMAT, datefmt=LOG_DATE_FORMAT)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.DEBUG if settings.debug else logging.INFO)
    logger.addHandler(console_handler)

    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=LOG_MAX_BYTES,
        backupCount=LOG_BACKUP_COUNT,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.DEBUG if settings.debug else logging.INFO)
    logger.addHandler(file_handler)

    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a logger instance for the given module name."""
    return logging.getLogger(name)
