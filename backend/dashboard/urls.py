from django.urls import path
from dashboard.views import DashboardStatsView, UserOrganizationListView, GlobalSearchView

urlpatterns = [
    path('organizations/<uuid:org_id>/dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('organizations/<uuid:org_id>/search/', GlobalSearchView.as_view(), name='global-search'),
    path('user/organizations/', UserOrganizationListView.as_view(), name='user-orgs'),
]
