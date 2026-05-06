from django.urls import path
from .views import (
    RegisterView, VerifyOTPView, LoginView,
    CreateOrganizationView, MyOrganizationsView, OrganizationMembersView,
    UpdateOrganizationView, RemoveMemberView,
    SendJoinRequestView, ManageJoinRequestView,
    ResendOTPView,
    CreateGoalView, GoalListView, GoalDetailView, DeleteGoalView,
    CreateTaskView, TaskListView, UpdateTaskStatusView,
    TaskDetailView,
    CreateTaskCommentView, TaskCommentsListView,
    FilteredTasksView, ActivityLogView, TaskAttachmentUploadView, 
    GlobalSearchView, BulkTaskUpdateView, 
    RemoveTaskAssigneeView, SoftDeleteTaskView, 
    DashboardStatsView, GenerateInviteLinkView, JoinViaInviteView,
    AvailableTalentView, QuickAssignTaskView, UserProfileView,
    ChatRoomListView, MessageHistoryView,
    SetupWorkspaceView, PersonalizeProfileView, InviteTeamView, JoinWorkspaceView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('setup-workspace/', SetupWorkspaceView.as_view(), name='setup-workspace'),
    path('personalize-profile/', PersonalizeProfileView.as_view(), name='personalize-profile'),
    path('invite-team/', InviteTeamView.as_view(), name='invite-team'),
    path('join-workspace/<str:token>/', JoinWorkspaceView.as_view(), name='join-workspace'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),

    path('organizations/create/', CreateOrganizationView.as_view(), name='create-organization'),
    path('my-organizations/', MyOrganizationsView.as_view(), name='my-organizations'),
    path('organizations/<uuid:org_id>/members/', OrganizationMembersView.as_view(), name='organization-members'),
    path('organizations/<uuid:org_id>/update/', UpdateOrganizationView.as_view(), name='update-organization'),
    path('organizations/<uuid:org_id>/remove-member/', RemoveMemberView.as_view(), name='remove-member'),
    
    path('organizations/<uuid:org_id>/invite-link/', GenerateInviteLinkView.as_view(), name='invite-link'),
    path('join-invite/<str:code>/', JoinViaInviteView.as_view(), name='join-invite'),

    path('organizations/<uuid:org_id>/join-request/', SendJoinRequestView.as_view(), name='send-join-request'),
    path('organizations/join-requests/<uuid:request_id>/manage/', ManageJoinRequestView.as_view(), name='manage-join-request'),

    path('organizations/<uuid:org_id>/goals/create/', CreateGoalView.as_view(), name='create-goal'),
    path('organizations/<uuid:org_id>/goals/', GoalListView.as_view(), name='goal-list'),
    path('goals/<uuid:goal_id>/', GoalDetailView.as_view(), name='goal-detail'),
    path('goals/<uuid:goal_id>/delete/', DeleteGoalView.as_view(), name='delete-goal'),

    path('goals/<uuid:goal_id>/tasks/create/', CreateTaskView.as_view(), name='create-task'),
    path('organizations/<uuid:org_id>/tasks/', TaskListView.as_view(), name='task-list'),
    path('tasks/<uuid:task_id>/update-status/', UpdateTaskStatusView.as_view(), name='update-task-status'),
    path('tasks/<uuid:task_id>/', TaskDetailView.as_view(), name='task-detail'),
    path('organizations/<uuid:org_id>/tasks/filter/', FilteredTasksView.as_view(), name='filtered-tasks'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),

    path('tasks/<uuid:task_id>/comments/', TaskCommentsListView.as_view(), name='task-comments-list'),
    path('tasks/<uuid:task_id>/comments/create/', CreateTaskCommentView.as_view(), name='create-task-comment'),
    
    path('organizations/<uuid:org_id>/activity-log/', ActivityLogView.as_view(), name='activity-log'),
    path('tasks/<uuid:task_id>/attachments/upload/', TaskAttachmentUploadView.as_view(), name='upload-attachment'),
    path('organizations/<uuid:org_id>/search/', GlobalSearchView.as_view(), name='global-search'),
    path('organizations/<uuid:org_id>/tasks/bulk-update/', BulkTaskUpdateView.as_view(), name='bulk-task-update'),
    path('tasks/<uuid:task_id>/remove-assignee/', RemoveTaskAssigneeView.as_view(), name='remove-assignee'),
    path('tasks/<uuid:task_id>/soft-delete/', SoftDeleteTaskView.as_view(), name='soft-delete-task'),

    path('organizations/<uuid:org_id>/dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('talent-pool/', AvailableTalentView.as_view(), name='talent-pool'),
    path('quick-assign-task/', QuickAssignTaskView.as_view(), name='quick-assign-task'),

    path('organizations/<uuid:org_id>/chat-rooms/', ChatRoomListView.as_view()),
    path('chat-rooms/<uuid:room_id>/history/', MessageHistoryView.as_view()),
]
