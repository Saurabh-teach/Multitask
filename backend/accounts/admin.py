from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Organization, OrganizationMember, OTPVerification

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'phone', 'email', 'first_name', 'last_name', 'is_active')
    search_fields = ('username', 'phone', 'email')
    list_filter = ('is_active', 'is_staff')


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'created_at')
    search_fields = ('name',)


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'organization', 'role', 'is_active', 'joined_at')
    list_filter = ('role', 'is_active')
    search_fields = ('user__username', 'organization__name')


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ('phone', 'otp', 'purpose', 'expires_at', 'created_at')
    list_filter = ('purpose',)
