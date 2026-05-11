from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q

from goals.models import Goal
from organizations.models import Organization, OrganizationMember
from goals.serializers import GoalSerializer, GoalDetailSerializer
from core.permissions import has_permission

class CreateGoalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, org_id):
        try:
            organization = Organization.objects.get(id=org_id)
            if not has_permission(request.user, organization, 'goal_create'):
                return Response({"error": "Permission denied: Insufficient privileges to create goals in this workspace."}, status=403)

            current_user = request.user
            member = OrganizationMember.objects.filter(
                organization=organization, 
                user=current_user
            ).first()
            
            data = request.data.copy()
            owner_id = data.get('owner')
            owner = current_user
            if owner_id:
                try:
                    from users.models import User
                    target_owner = User.objects.get(id=owner_id)
                    if member and member.role == 'user':
                        target_membership = OrganizationMember.objects.filter(organization=organization, user=target_owner).first()
                        if target_membership and target_membership.role in ['admin', 'owner']:
                            return Response({"error": "Regular users cannot assign goals to Admins or Owners."}, status=403)
                    owner = target_owner
                    data['owner'] = str(owner.id)
                except Exception:
                    data.pop('owner', None)

            serializer = GoalSerializer(data=data)
            if serializer.is_valid():
                goal = serializer.save(
                    organization=organization,
                    created_by=current_user,
                    owner=owner
                )
                
                if goal.visibility_type == 'specific':
                    if member and member.role == 'user':
                        from users.models import User
                        management_users = User.objects.filter(
                            memberships__organization=organization,
                            memberships__role__in=['admin', 'owner']
                        )
                        for mgmt_user in management_users:
                            goal.visible_to.add(mgmt_user)
                    
                    goal.visible_to.add(current_user)
                    if owner:
                        goal.visible_to.add(owner)
                
                from activity_logs.models import ActivityLog
                try:
                    ActivityLog.objects.create(
                        user=current_user,
                        organization=organization,
                        action="Created Goal",
                        target_type="Goal",
                        target_id=str(goal.id),
                        description=f"Created a new goal: {goal.title}"
                    )
                except Exception:
                    pass

                return Response({"message": "Goal created successfully!", "goal": GoalSerializer(goal).data}, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found"}, status=404)

class GoalListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        try:
            organization = Organization.objects.get(id=org_id)
            
            membership = OrganizationMember.objects.filter(organization=organization, user=request.user).first()
            if not membership:
                return Response({"error": "Unauthorized"}, status=403)

            if membership.role in ['owner', 'admin']:
                goals = Goal.objects.filter(organization=organization)
            else:
                goals = Goal.objects.filter(
                    organization=organization
                ).filter(
                    Q(visibility_type='organization') |
                    Q(created_by=request.user) | 
                    Q(owner=request.user) | 
                    Q(visible_to=request.user) |
                    Q(tasks__assignees=request.user)
                ).distinct()

            return Response(GoalSerializer(goals, many=True).data)
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found"}, status=404)

class GoalDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, goal_id):
        try:
            goal = Goal.objects.get(id=goal_id)
            membership = OrganizationMember.objects.filter(organization=goal.organization, user=request.user).first()
            if not membership:
                return Response({"error": "Permission denied"}, status=403)

            if membership.role not in ['owner', 'admin']:
                can_see = Goal.objects.filter(id=goal_id).filter(
                    Q(visibility_type='organization') |
                    Q(created_by=request.user) | 
                    Q(owner=request.user) | 
                    Q(visible_to=request.user) |
                    Q(tasks__assignees=request.user)
                ).exists()
                if not can_see:
                    return Response({"error": "This goal is private and has not been shared with you."}, status=403)
            
            goal.update_progress()
            return Response(GoalDetailSerializer(goal).data)
        except Goal.DoesNotExist:
            return Response({"error": "Goal not found"}, status=404)

    def patch(self, request, goal_id):
        goal = get_object_or_404(Goal, id=goal_id)
        
        # Permission check
        can_edit = has_permission(request.user, goal.organization, 'goal_edit_any')
        is_owner = goal.owner_id == request.user.id
        
        if not (can_edit or is_owner):
            return Response({"error": "Unauthorized to edit this goal"}, status=403)
            
        serializer = GoalSerializer(goal, data=request.data, partial=True)
        if serializer.is_valid():
            updated_goal = serializer.save()
            
            if updated_goal.visibility_type == 'specific':
                creator_membership = OrganizationMember.objects.filter(organization=updated_goal.organization, user=updated_goal.created_by).first()
                if creator_membership and creator_membership.role == 'user':
                    from users.models import User
                    management_users = User.objects.filter(
                        memberships__organization=updated_goal.organization,
                        memberships__role__in=['admin', 'owner']
                    )
                    for mgmt_user in management_users:
                        updated_goal.visible_to.add(mgmt_user)
            
            return Response(GoalSerializer(updated_goal).data)
        return Response(serializer.errors, status=400)

    def put(self, request, *args, **kwargs):
        return self.patch(request, *args, **kwargs)

class DeleteGoalView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, goal_id):
        try:
            goal = Goal.objects.get(id=goal_id)
            can_delete = has_permission(request.user, goal.organization, 'goal_delete_any')
            is_creator = goal.created_by_id == request.user.id
            
            if not (can_delete or is_creator):
                return Response({"error": "Only Admins or the Goal Creator can delete goals."}, status=403)
            
            goal.delete()
            return Response({"message": "Goal deleted successfully!"}, status=204)
        except Goal.DoesNotExist:
            return Response({"error": "Goal not found"}, status=404)
