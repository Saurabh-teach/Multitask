from django.contrib import admin

# pyrefly: ignore [missing-import]
from .models import Goal
admin.site.register(Goal)
