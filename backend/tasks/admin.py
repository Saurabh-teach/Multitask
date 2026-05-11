from django.contrib import admin
from tasks.models import Task, TaskComment, TaskAttachment

admin.site.register(Task)
admin.site.register(TaskComment)
admin.site.register(TaskAttachment)
