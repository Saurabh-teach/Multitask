from django.urls import path
from organizations.views import (
    SetupWorkspaceView, CreateOrganizationView, MyOrganizationsView, 
    OrganizationMembersView, UpdateMemberPermissionsView, 
    InviteTeamView, JoinWorkspaceView, AvailableTalentView, 
    GenerateInviteLinkView, OrganizationUpdateView, RemoveMemberView, JoinViaInviteView,
    SearchOrganizationView
)

urlpatterns = [
    path('setup-workspace/', SetupWorkspaceView.as_view(), name='setup-workspace'),
    path('organizations/create/', CreateOrganizationView.as_view(), name='create-organization'),
    path('my-organizations/', MyOrganizationsView.as_view(), name='my-organizations'),
    path('organizations/<uuid:org_id>/members/', OrganizationMembersView.as_view(), name='organization-members'),
    path('organizations/<uuid:org_id>/members/<uuid:member_id>/update-permissions/', UpdateMemberPermissionsView.as_view(), name='update-member-permissions'),
    path('organizations/<uuid:org_id>/update/', OrganizationUpdateView.as_view(), name='organization-update'),
    path('invite-team/', InviteTeamView.as_view(), name='invite-team'),
    path('join-workspace/<str:token>/', JoinWorkspaceView.as_view(), name='join-workspace'),
    path('talent-pool/', AvailableTalentView.as_view(), name='talent-pool'),
    path('organizations/<uuid:org_id>/invite-link/', GenerateInviteLinkView.as_view(), name='invite-link'),
    path('search-organizations/', SearchOrganizationView.as_view(), name='search-organizations'),

    path('organizations/members/<uuid:member_id>/remove/', RemoveMemberView.as_view(), name='remove-member'),
    path('organizations/join/invite-code/<str:code>/', JoinViaInviteView.as_view(), name='join-via-invite'),
]
