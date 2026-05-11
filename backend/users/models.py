from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid
from django.utils import timezone

class User(AbstractUser):
    """Main User Table"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    phone = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    
    city = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    job_title = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    
    # Track progressive setup state
    setup_step = models.IntegerField(default=1) # 1: Account, 2: Workspace, 3: Personalize, 4: Invite, 5: Complete

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts_user'

    def __str__(self):
        return self.get_full_name() or self.username or str(self.phone)

class OTPVerification(models.Model):
    phone = models.CharField(max_length=15)
    otp = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    attempts = models.IntegerField(default=0)
    purpose = models.CharField(max_length=20, default='register')
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.expires_at

    class Meta:
        db_table = 'accounts_otpverification'
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.phone}"
