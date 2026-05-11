from django.contrib import admin
from organizations.models import Organization, OrganizationMember, Invitation, JoinRequest, InviteCode

admin.site.register(Organization)
admin.site.register(OrganizationMember)
admin.site.register(Invitation)
admin.site.register(JoinRequest)
admin.site.register(InviteCode)
