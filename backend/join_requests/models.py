from django.db import models
from django.conf import settings
import uuid

class JoinRequest(models.Model):
    """
    Model for users to request access to an organization.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='join_requests')
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='join_requests')
    
    requested_role = models.CharField(max_length=20, default='user')
    message = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_join_requests')

    class Meta:
        db_table = 'join_requests_request'
        unique_together = ('user', 'organization') # One pending request per org
        ordering = ['-requested_at']

    def __str__(self):
        return f"{self.user} -> {self.organization.name}"
