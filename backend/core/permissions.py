from functools import wraps
from rest_framework.response import Response
from organizations.models import OrganizationMember

# ROLE HIERARCHY
ROLE_HIERARCHY = {
    'owner': 3,
    'admin': 2,
    'user': 1
}

# DEFAULT PERMISSION TABLE
DEFAULT_PERMISSIONS = {
    'owner': [
        'org_edit', 'org_delete', 'org_view',
        'member_invite', 'member_approve', 'member_remove', 'member_change_role',
        'goal_create', 'goal_edit_any', 'goal_delete_any', 'goal_view_all',
        'task_create', 'task_edit_any', 'task_delete_any', 'task_assign', 'task_status_change',
        'view_logs', 'export_data', 'view_analytics', 'manage_billing',
        'chat_manage', 'file_upload'
    ],
    'admin': [
        'org_edit', 'org_view',
        'member_invite', 'member_approve', 'member_remove', 'member_change_role',
        'goal_create', 'goal_edit_any', 'goal_delete_any', 'goal_view_all',
        'task_create', 'task_edit_any', 'task_delete_any', 'task_assign', 'task_status_change',
        'view_logs', 'export_data', 'view_analytics',
        'chat_manage', 'file_upload'
    ],
    'user': [
        'org_view',
        'goal_create', 'goal_view_all',
        'task_create', 'task_status_change',
        'chat_access', 'file_upload'
    ]
}

# ROLE DELEGATION CONSTRAINTS
DELEGATABLE_PERMISSIONS = {
    'owner': '__all__',
    'admin': [
        'goal_create', 'goal_edit_any', 'goal_delete_any', 'task_create', 
        'task_delete_any', 'task_assign', 'view_logs', 'view_analytics', 
        'export_data', 'chat_manage', 'file_upload'
    ],
    'user': [
        'task_create', 'task_assign', 'file_upload','goal_delete_any'
    ]
}

def has_permission(user, organization, permission_key):
    try:
        member = OrganizationMember.objects.filter(user=user, organization=organization).first()
        if not member:
            return False
        
        manual_perms = member.permissions or {}
        if permission_key in manual_perms:
            return manual_perms[permission_key]
            
        if permission_key in DEFAULT_PERMISSIONS.get(member.role, []):
            return True
            
        return False
    except OrganizationMember.DoesNotExist:
        return False

def has_role(required_role):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            org_id = kwargs.get('org_id') or request.data.get('org_id')
            if not org_id:
                return Response({"error": "Organization Context Required"}, status=400)
            
            try:
                member = OrganizationMember.objects.get(user=request.user, organization_id=org_id)
                if ROLE_HIERARCHY.get(member.role, 0) >= ROLE_HIERARCHY.get(required_role, 0):
                    return view_func(request, *args, **kwargs)
                return Response({"error": f"Access Denied: Requires {required_role} role."}, status=403)
            except OrganizationMember.DoesNotExist:
                return Response({"error": "Not a member of this organization."}, status=403)
        return _wrapped_view
    return decorator

def can_manage_member(granter, receiver, organization):
    try:
        g_member = OrganizationMember.objects.get(user=granter, organization=organization)
        r_member = OrganizationMember.objects.get(user=receiver, organization=organization)
        return ROLE_HIERARCHY.get(g_member.role, 0) > ROLE_HIERARCHY.get(r_member.role, 0)
    except:
        return False
