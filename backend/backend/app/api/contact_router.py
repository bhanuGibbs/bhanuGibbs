from __future__ import annotations

import logging

from fastapi import APIRouter, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas.contact import ContactForm
from app.services.email_service import EmailConfigurationError, EmailDeliveryError, EmailService

router = APIRouter(prefix="/contact", tags=["Contact"])
logger = logging.getLogger(__name__)

# Rate limiter for contact form to prevent spam
contact_limiter = Limiter(key_func=get_remote_address)


@router.post("/submit", status_code=status.HTTP_200_OK)
@contact_limiter.limit("5/hour")
async def submit_contact(request: Request, payload: ContactForm) -> dict:
    """Submit a contact form message (public endpoint, no authentication required)."""
    logger.info(
        "Contact form submission: name=%s, email=%s, mobile=%s, message=%s",
        payload.name,
        payload.email,
        payload.mobile,
        payload.message[:100],
    )

    # Attempt to send an alert email to the admin; fail gracefully if not configured
    email_service = EmailService()
    try:
        await email_service.send_contact_alert_email(
            sender_name=payload.name,
            sender_email=payload.email,
            sender_mobile=payload.mobile,
            message_text=payload.message,
        )
        logger.info("Contact alert email sent for: %s", payload.name)
    except EmailConfigurationError:
        logger.warning("Contact alert email is not configured — skipping email notification.")
    except EmailDeliveryError as error:
        logger.error("Contact alert email delivery failed: %s", error)

    return {"status": "ok", "message": "Thank you for your message. We will get back to you soon."}
