from django.db import models
from django.conf import settings
import uuid
from django.utils import timezone

from django.utils.text import slugify

class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    
    # Unique Organization Mailbox Email
    organization_email = models.EmailField(unique=True, null=True, blank=True)
    
    description = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    logo = models.ImageField(upload_to='org_logos/', blank=True, null=True)
    is_public = models.BooleanField(default=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_orgs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts_organization'

    def save(self, *args, **kwargs):
        # Auto-generate unique organization email if not provided
        if not self.organization_email:
            base_slug = slugify(self.name)
            self.organization_email = f"{base_slug}@goalflow.app"
            
            # Ensure uniqueness
            counter = 1
            original_email = self.organization_email
            while Organization.objects.filter(organization_email=self.organization_email).exists():
                prefix = original_email.split('@')[0]
                self.organization_email = f"{prefix}-{counter}@goalflow.app"
                counter += 1
                
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name



class OrganizationMember(models.Model):
    ROLE_CHOICES = [
        ('owner', 'Owner'), ('admin', 'Admin'), ('user', 'User'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='memberships')
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    permissions = models.JSONField(default=dict, blank=True) # Granular overrides
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts_organizationmember'
        unique_together = ('organization', 'user')
        ordering = ['-joined_at']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} - {self.role} in {self.organization}"


class InviteCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='invite_codes')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=20, default='user')
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts_invitecode'

    def __str__(self):
        return f"{self.code} for {self.organization.name}"
