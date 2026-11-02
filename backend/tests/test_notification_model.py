
from backend.app.models.notification import Notification


def test_notification_model_has_expected_fields():
    assert hasattr(Notification, "user_id")
    assert hasattr(Notification, "notification_type")
    assert hasattr(Notification, "title")
    assert hasattr(Notification, "message")
    assert hasattr(Notification, "is_read")
    assert hasattr(Notification, "created_at")
