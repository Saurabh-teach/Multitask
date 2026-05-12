from django.contrib import admin
from organizations.models import Organization, OrganizationMember, InviteCode

admin.site.register(Organization)
admin.site.register(OrganizationMember)
admin.site.register(InviteCode)
