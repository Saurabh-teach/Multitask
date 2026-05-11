from django.urls import path

from activity_logs.views import ActivityLogView

urlpatterns = [
    path('organizations/<uuid:org_id>/activity-log/', ActivityLogView.as_view(), name='activity-log'),
]
