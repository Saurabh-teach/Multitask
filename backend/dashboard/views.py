from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q

from organizations.models import Organization, OrganizationMember
from goals.models import Goal
from tasks.models import Task
from activity_logs.models import ActivityLog
from goals.serializers import GoalSerializer
from tasks.serializers import TaskSerializer
from organizations.serializers import OrganizationSerializer
from activity_logs.serializers import ActivityLogSerializer
from core.permissions import DEFAULT_PERMISSIONS

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        try:
            org = Organization.objects.get(id=org_id)
            user = request.user
            member = OrganizationMember.objects.filter(organization=org, user=user).first()
            if not member:
                return Response({"error": "Permission denied"}, status=403)

            # Filtering for stats based on role and visibility
            if member.role in ['owner', 'admin']:
                visible_goals_base = Goal.objects.filter(organization=org)
                visible_tasks_base = Task.objects.filter(organization=org, is_deleted=False)
            else:
                visible_goals_base = Goal.objects.filter(organization=org).filter(
                    Q(visibility_type='organization') | Q(created_by=user) | Q(owner=user) | Q(visible_to=user) | Q(tasks__assignees=user)
                ).distinct()
                visible_tasks_base = Task.objects.filter(organization=org, is_deleted=False).filter(
                    Q(visibility_type='organization') | Q(created_by=user) | Q(assignees=user) | Q(visible_to=user)
                ).distinct()

            active_goals = visible_goals_base.exclude(status='completed').count()
            open_tasks = visible_tasks_base.exclude(status='done').count()
            
            total_tasks = visible_tasks_base.count()
            done_tasks = visible_tasks_base.filter(status='done').count()
            completion = int((done_tasks / total_tasks * 100) if total_tasks > 0 else 0)
            
            team_members = OrganizationMember.objects.filter(organization=org, is_active=True).count()
            
            activity_qs = ActivityLog.objects.filter(organization=org).order_by('-created_at')[:10]
            recent_activity = ActivityLogSerializer(activity_qs, many=True).data
            
            recent_goals_qs = visible_goals_base.order_by('-created_at')[:5]
            recent_goals = [{"id": str(g.id), "title": g.title, "status": g.status, "progress": g.progress} for g in recent_goals_qs]

            # Build actual effective permissions for the frontend
            from core.permissions import DEFAULT_PERMISSIONS
            effective_permissions = DEFAULT_PERMISSIONS.get(member.role, []).copy()
            if member.permissions:
                for perm, value in member.permissions.items():
                    if value is True and perm not in effective_permissions:
                        effective_permissions.append(perm)
                    elif value is False and perm in effective_permissions:
                        effective_permissions.remove(perm)

            my_tasks = []
            my_created_goals = []
            my_created_tasks = []
            
            if user.is_authenticated:
                # Tasks assigned to user
                assigned_tasks_qs = Task.objects.filter(organization=org, assignees=user, is_deleted=False).exclude(status='done').order_by('due_date')[:10]
                my_tasks = [{"id": str(t.id), "title": t.title, "status": t.status, "priority": t.priority, "due_date": t.due_date} for t in assigned_tasks_qs]
                
                # Goals created by user (with their tasks)
                created_goals_qs = Goal.objects.filter(organization=org, created_by=user).order_by('-created_at')[:5]
                my_created_goals = []
                for g in created_goals_qs:
                    tasks_qs = Task.objects.filter(goal=g, is_deleted=False).prefetch_related('assignees')[:5]
                    tasks = [
                        {
                            "id": str(t.id), 
                            "title": t.title, 
                            "status": t.status,
                            "assignees": [u.first_name or u.username for u in t.assignees.all()]
                        } for t in tasks_qs
                    ]
                    my_created_goals.append({
                        "id": str(g.id), 
                        "title": g.title, 
                        "status": g.status, 
                        "progress": g.progress,
                        "tasks": tasks
                    })
                
                # Tasks created by user
                created_tasks_qs = Task.objects.filter(organization=org, created_by=user).order_by('-created_at')[:5]
                my_created_tasks = [{"id": str(t.id), "title": t.title, "status": t.status} for t in created_tasks_qs]
            
            return Response({
                "role": member.role,
                "permissions": effective_permissions,
                "activeGoals": active_goals,
                "openTasks": open_tasks,
                "completion": completion,
                "teamMembers": team_members,
                "recentGoals": recent_goals,
                "myTasks": my_tasks,
                "myCreatedGoals": my_created_goals,
                "myCreatedTasks": my_created_tasks,
                "recentActivity": recent_activity
            }, status=200)
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found"}, status=404)

class UserOrganizationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = OrganizationMember.objects.filter(user=request.user, is_active=True)
        organizations = [m.organization for m in memberships]
        return Response(OrganizationSerializer(organizations, many=True).data)

class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        query = request.query_params.get('q', '')
        if not query:
            return Response({"tasks": [], "goals": []})
            
        org = get_object_or_404(Organization, id=org_id)
        
        tasks = Task.objects.filter(organization=org, title__icontains=query, is_deleted=False)
        goals = Goal.objects.filter(organization=org, title__icontains=query, is_deleted=False)
        
        return Response({
            "tasks": TaskSerializer(tasks, many=True).data,
            "goals": GoalSerializer(goals, many=True).data
        })
