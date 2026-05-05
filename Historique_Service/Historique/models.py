from django.db import models


class ActionLog(models.Model):
    """Audit trail — every significant user action is logged here."""

    class ActionType(models.TextChoices):
        IMAGE_UPLOADED = 'image_uploaded', 'Image Uploaded'
        IMAGE_DELETED = 'image_deleted', 'Image Deleted'
        IMAGE_VERIFIED = 'image_verified', 'Image Verified'
        USER_LOGIN = 'user_login', 'User Login'
        USER_LOGOUT = 'user_logout', 'User Logout'
        USER_REGISTERED = 'user_registered', 'User Registered'
        OTHER = 'other', 'Other'

    user_id = models.IntegerField(
        help_text='ID of the user who performed the action.',
        db_index=True,
    )
    action = models.CharField(
        max_length=50,
        choices=ActionType.choices,
        default=ActionType.OTHER,
        db_index=True,
    )
    details = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional context (image_id, title, status, etc.)',
    )
    service = models.CharField(
        max_length=100,
        default='unknown',
        help_text='The microservice that generated this log entry.',
    )
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Action Log'
        verbose_name_plural = 'Action Logs'

    def __str__(self):
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] User {self.user_id} → {self.action}"
