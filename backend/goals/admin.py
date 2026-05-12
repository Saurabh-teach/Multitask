from django.contrib import admin

# pyrefly: ignore [missing-import]
from goals.models import Goal
admin.site.register(Goal)
