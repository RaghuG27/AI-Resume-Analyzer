
from app.core.config import settings
import smtplib
import logging
from email.message import EmailMessage

from celery import shared_task


logger = logging.getLogger(__name__)


def send_status_email(
    recipient: str,
    title: str,
    message: str,
) -> None:
    host = settings.SMTP_HOST
    username = settings.SMTP_USERNAME
    password = settings.SMTP_PASSWORD
    sender = settings.EMAIL_FROM
    port = settings.SMTP_PORT

    if not all([host, username, password, sender]):
        raise RuntimeError("SMTP configuration is incomplete")

    email = EmailMessage()
    email["Subject"] = title
    email["From"] = sender
    email["To"] = recipient
    email.set_content(message)

    with smtplib.SMTP(host, port, timeout=15) as server:
        server.starttls()
        server.login(username, password)
        server.send_message(email)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
)
def send_application_status_email(
    self,
    recipient: str,
    title: str,
    message: str,
):
    try:
        send_status_email(recipient, title, message)
        return {"status": "sent"}
    except Exception as exc:
        logger.exception("Application status email delivery failed")

        if self.request.retries >= self.max_retries:
            logger.error("Email delivery exhausted its retry attempts")
            raise

        raise self.retry(exc=exc, countdown=30 * (2 ** self.request.retries))
