from django.db import models
from django.conf import settings
import uuid

class Task(models.Model):
    TYPE_CHOICES = [('task', 'Task'), ('story', 'Story'), ('bug', 'Bug')]
    STATUS_CHOICES = [
        ('backlog', 'Backlog'),
        ('todo', 'To Do'), 
        ('in_progress', 'In Progress'), 
        ('in_review', 'In Review'), 
        ('testing', 'Testing'), 
        ('done', 'Done')
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'), 
        ('medium', 'Medium'), 
        ('high', 'High'), 
        ('urgent', 'Urgent')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    issue_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='task')
    goal = models.ForeignKey('goals.Goal', on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, null=True)
    assignees = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='assigned_tasks', blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    due_date = models.DateField(null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_tasks')
    is_deleted = models.BooleanField(default=False)
    assigned_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Visibility Control
    VISIBILITY_CHOICES = [('organization', 'Entire Organization'), ('specific', 'Specific Users')]
    visibility_type = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='organization')
    visible_to = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='visible_tasks', blank=True)

    class Meta:
        db_table = 'accounts_task'
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

class TaskComment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts_taskcomment'
        ordering = ['-created_at']

class TaskAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='task_attachments/%Y/%m/%d/')
    file_name = models.CharField(max_length=255)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts_taskattachment'

    def __str__(self):
        return f"{self.file_name} on {self.task.title}"
