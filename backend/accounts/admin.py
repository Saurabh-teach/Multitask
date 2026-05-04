from django.contrib import admin
from .models import User, Organization, OrganizationMember, JoinRequest, OTPVerification, Goal, Task, TaskComment

# ====================== CUSTOM USER ADMIN ======================
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['username', 'first_name', 'last_name', 'phone', 'email', 'city', 'job_title', 'is_active']
    search_fields = ['username', 'first_name', 'last_name', 'phone', 'email']
    list_filter = ['is_active', 'is_staff']

# ====================== ORGANIZATION MEMBER ADMIN (Improved) ======================
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = [
        'user_full_name', 
        'organization', 
        'role', 
        'is_active', 
        'joined_at'
    ]
    list_filter = ['role', 'is_active', 'organization']
    search_fields = ['user__first_name', 'user__last_name', 'user__username', 'user__phone']
    raw_id_fields = ['user', 'organization']

    def user_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    user_full_name.short_description = 'Employee Name'

    def user_phone(self, obj):
        return obj.user.phone
    user_phone.short_description = 'Phone'

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'

    def user_job_title(self, obj):
        return obj.user.job_title
    user_job_title.short_description = 'Job Title'

# Register improved admins
admin.site.register(User, CustomUserAdmin)
admin.site.register(Organization)
admin.site.register(OrganizationMember, OrganizationMemberAdmin)
admin.site.register(JoinRequest)
admin.site.register(OTPVerification)

admin.site.register(Goal)
admin.site.register(Task)
admin.site.register(TaskComment)