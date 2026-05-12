from django.db import models
from django.conf import settings
import uuid

class Notification(models.Model):
    """
    Enterprise alert system for invitations, join requests, and tasks.
    """
    NOTIFICATION_TYPES = [
        ('invitation', 'Invitation'),
        ('join_request', 'Join Request'),
        ('org_inquiry', 'Organization Mail'),
        ('task_assigned', 'Task Assigned'),
        ('system', 'System Update')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    link = models.CharField(max_length=255, blank=True, null=True)
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications_notification'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} for {self.recipient.email}"
