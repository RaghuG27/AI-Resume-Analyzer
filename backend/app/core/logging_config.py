# app/core/logging_config.py

import json
import logging
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        request_id = getattr(record, "request_id", None)
        if request_id:
            log_entry["request_id"] = request_id

        if record.exc_info:
            log_entry["exception"] = self.formatException(
                record.exc_info
            )

        return json.dumps(log_entry)


def configure_logging() -> None:
    root_logger = logging.getLogger()

    # Avoid adding duplicate handlers when configuration runs again.
    if not any(
        getattr(handler, "_resumeai_json_handler", False)
        for handler in root_logger.handlers
    ):
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        handler._resumeai_json_handler = True
        root_logger.addHandler(handler)

    root_logger.setLevel(logging.INFO)