from django.db.models import Q
from organizations.models import OrganizationMember

class GoalCalculator:
    @staticmethod
    def update_goal_progress(goal):
        """
        Calculates and updates the progress of a given Goal based on its tasks.
        Modifies the goal instance and saves it.
        """
        total_count = goal.tasks.filter(is_deleted=False).count()
        if total_count == 0:
            goal.progress = 0
            goal.status = 'not_started'
        else:
            completed_count = goal.tasks.filter(is_deleted=False, status='done').count()
            goal.progress = (completed_count / total_count) * 100
            
            if goal.progress == 100:
                goal.status = 'completed'
            elif goal.progress > 0:
                if goal.status == 'not_started':
                    goal.status = 'in_progress'
            else:
                if goal.status != 'at_risk':
                    goal.status = 'in_progress'
        goal.save()
        return goal.progress

class DashboardCalculator:
    @staticmethod
    def get_workspace_metrics(org, user, member):
        """
        Calculates top-level metrics for the dashboard view based on user visibility.
        """
        from goals.models import Goal
        from tasks.models import Task

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
        
        return {
            "active_goals": active_goals,
            "open_tasks": open_tasks,
            "total_tasks": total_tasks,
            "done_tasks": done_tasks,
            "completion": completion,
            "team_members": team_members,
            "visible_goals_base": visible_goals_base,
            "visible_tasks_base": visible_tasks_base,
        }

class OrganizationCalculator:
    @staticmethod
    def get_member_count(organization):
        """
        Calculates the total number of active members in an organization.
        """
        return organization.members.filter(is_active=True).count()

