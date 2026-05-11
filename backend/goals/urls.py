from django.urls import path
from goals.views import CreateGoalView, GoalListView, GoalDetailView, DeleteGoalView

urlpatterns = [
    path('organizations/<uuid:org_id>/goals/', GoalListView.as_view(), name='goal_list'),
    path('organizations/<uuid:org_id>/goals/create/', CreateGoalView.as_view(), name='goal_create'),
    path('goals/<uuid:goal_id>/', GoalDetailView.as_view(), name='goal_detail'),
    path('goals/<uuid:goal_id>/delete/', DeleteGoalView.as_view(), name='goal_delete'),
]
