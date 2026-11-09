from __future__ import annotations


class ServiceError(Exception):
    """Base exception for service layer errors."""


class NotFoundError(ServiceError):
    """Exception for not found resources."""


class ConflictError(ServiceError):
    """Exception for conflict errors."""


class BadRequestError(ServiceError):
    """Exception for invalid request data."""


class MonthlyQuotationLimitError(ServiceError):
    """Raised when a user has reached their monthly finalized quotation limit."""
