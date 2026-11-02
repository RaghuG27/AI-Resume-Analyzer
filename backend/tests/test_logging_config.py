
import json
import logging
import sys

from backend.app.core.logging_config import JSONFormatter


def create_log_record(
    message: str,
    *,
    level: int = logging.INFO,
    extra: dict | None = None,
    exc_info=None,
) -> logging.LogRecord:
    record = logging.LogRecord(
        name="resumeai.test",
        level=level,
        pathname=__file__,
        lineno=1,
        msg=message,
        args=(),
        exc_info=exc_info,
    )

    if extra:
        for key, value in extra.items():
            setattr(record, key, value)

    return record


def test_json_formatter_outputs_valid_json():
    record = create_log_record("Test log message")

    result = json.loads(JSONFormatter().format(record))

    assert result["message"] == "Test log message"
    assert result["level"] == "INFO"
    assert result["logger"] == "resumeai.test"
    assert "timestamp" in result


def test_json_formatter_includes_request_id():
    record = create_log_record(
        "Request processed",
        extra={"request_id": "req-test-123"},
    )

    result = json.loads(JSONFormatter().format(record))

    assert result["request_id"] == "req-test-123"


def test_json_formatter_includes_exception_details():
    try:
        raise ValueError("Test exception")
    except ValueError:
        exception_info = sys.exc_info()

    record = create_log_record(
        "An error occurred",
        level=logging.ERROR,
        exc_info=exception_info,
    )

    result = json.loads(JSONFormatter().format(record))

    assert result["level"] == "ERROR"
    assert "exception" in result
    assert "ValueError: Test exception" in result["exception"]
