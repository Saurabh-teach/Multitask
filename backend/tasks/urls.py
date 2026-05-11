from django.urls import path
from tasks.views import (
    CreateTaskView, TaskListView, TaskDetailView, UpdateTaskStatusView,
    SoftDeleteTaskView, TrashView, RestoreTaskView, 
    TaskCommentsListView, CreateTaskCommentView, TaskAttachmentUploadView,
    BulkTaskUpdateView, QuickAssignTaskView, FilteredTasksView, RemoveTaskAssigneeView
)

urlpatterns = [
    path('goals/<uuid:goal_id>/tasks/create/', CreateTaskView.as_view(), name='create-task'),
    path('organizations/<uuid:org_id>/tasks/', TaskListView.as_view(), name='task-list'),
    path('tasks/<uuid:task_id>/', TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<uuid:task_id>/update-status/', UpdateTaskStatusView.as_view(), name='update-task-status'),
    path('tasks/<uuid:task_id>/soft-delete/', SoftDeleteTaskView.as_view(), name='soft-delete-task'),
    path('organizations/<uuid:org_id>/trash/', TrashView.as_view(), name='trash-list'),
    path('tasks/<uuid:task_id>/restore/', RestoreTaskView.as_view(), name='restore-task'),
    path('tasks/<uuid:task_id>/comments/', TaskCommentsListView.as_view(), name='task-comments-list'),
    path('tasks/<uuid:task_id>/comments/create/', CreateTaskCommentView.as_view(), name='create-task-comment'),
    path('tasks/<uuid:task_id>/attachments/upload/', TaskAttachmentUploadView.as_view(), name='upload-attachment'),
    path('organizations/<uuid:org_id>/tasks/bulk-update/', BulkTaskUpdateView.as_view(), name='bulk-task-update'),
    path('quick-assign-task/', QuickAssignTaskView.as_view(), name='quick-assign-task'),
    path('organizations/<uuid:org_id>/tasks/filter/', FilteredTasksView.as_view(), name='filtered-tasks'),
    path('tasks/<uuid:task_id>/remove-assignee/', RemoveTaskAssigneeView.as_view(), name='remove-task-assignee'),
]
