from django.db import models
from django.conf import settings
import uuid
from django.utils import timezone

class InvitationTemplate(models.Model):
    """
    Predefined invitation messages (e.g., 'developer onboarding', 'admin setup').
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    subject = models.CharField(max_length=255)
    body_content = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'invitations_template'

    def __str__(self):
        return self.name

class Invitation(models.Model):
    """
    Core invitation record. Replaces the generic one in organizations.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'), 
        ('accepted', 'Accepted (Waiting Finalization)'), 
        ('declined', 'Declined'), 
        ('expired', 'Expired'),
        ('finalized', 'Finalized') 
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    
    # We reference the organization via string to avoid circular imports
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='new_invitations')
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_workspace_invites')
    
    role = models.CharField(max_length=20, default='user')
    message = models.TextField(blank=True, null=True)
    token = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    resend_count = models.IntegerField(default=0)
    
    # Timeline timestamps for analytics
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    last_sent_at = models.DateTimeField(auto_now_add=True)
    viewed_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    declined_at = models.DateTimeField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    def is_expired(self):
        return timezone.now() > self.expires_at

    class Meta:
        db_table = 'invitations_invitation'
        unique_together = ('email', 'organization') # Prevents duplicate active invites

    def __str__(self):
        return f"Invite to {self.email} for {self.organization.name}"


class InvitationTimeline(models.Model):
    """
    Audit log specifically for tracking the lifecycle of an invitation.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='timeline')
    action = models.CharField(max_length=50) # e.g., 'sent', 'viewed', 'accepted', 'declined', 'resent'
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True) # Store IP address, browser info, etc.
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'invitations_timeline'
        ordering = ['-created_at']

class PendingMemberReview(models.Model):
    """
    Queue for owners/admins to review and finalize users who have accepted their invitations.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invitation = models.OneToOneField(Invitation, on_delete=models.CASCADE, related_name='pending_review')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    final_status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'invitations_pending_review'
        ordering = ['-created_at']

    def __str__(self):
        return f"Review for {self.invitation.email}"
