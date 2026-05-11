from django.db import models
from django.conf import settings
import uuid

class Goal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='owned_goals')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_goals')
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    progress = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=[('not_started', 'Not Started'), ('in_progress', 'In Progress'), ('at_risk', 'At Risk'), ('completed', 'Completed')], default='not_started')
    priority = models.CharField(max_length=20, choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='medium')
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Visibility Control
    VISIBILITY_CHOICES = [('organization', 'Entire Organization'), ('specific', 'Specific Users')]
    visibility_type = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='organization')
    visible_to = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='visible_goals', blank=True)

    class Meta:
        db_table = 'accounts_goal'
        unique_together = ('title', 'organization')
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def soft_delete(self):
        self.is_deleted = True
        self.save()

    def restore(self):
        self.is_deleted = False
        self.save()

    def update_progress(self):
        active_tasks = self.tasks.filter(is_deleted=False)
        total_count = active_tasks.count()
        
        if total_count == 0:
            self.progress = 0
        else:
            completed_count = active_tasks.filter(status='done').count()
            self.progress = (completed_count / total_count) * 100
            
            if self.progress == 100:
                self.status = 'completed'
            elif self.progress > 0:
                if self.status in ['not_started', 'at_risk']:
                    self.status = 'in_progress'
            else:
                if self.status == 'completed':
                    self.status = 'in_progress'
        
        self.save()
