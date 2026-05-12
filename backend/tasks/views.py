from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone

from tasks.models import Task, TaskComment, TaskAttachment
from organizations.models import Organization, OrganizationMember
from tasks.serializers import (
    TaskSerializer, TaskDetailSerializer,
    TaskCommentSerializer, TaskAttachmentSerializer
)
from core.permissions import has_permission


class CreateTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, goal_id=None):
        org_id = request.data.get('organization')
        organization = get_object_or_404(Organization, id=org_id)

        if not has_permission(request.user, organization, 'task_create'):
            return Response({"error": "Permission denied: You do not have permission to create tasks in this workspace."}, status=403)

        assignees = request.data.get('assignees', [])
        if assignees and not has_permission(request.user, organization, 'task_assign'):
            return Response({"error": "Permission denied: You do not have permission to assign tasks to others."}, status=403)

        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            assigned_at = timezone.now() if assignees else None
            task = serializer.save(
                organization=organization,
                created_by=request.user,
                assigned_at=assigned_at
            )

            if assignees:
                member = OrganizationMember.objects.filter(
                    organization=organization, user=request.user).first()
                if member and member.role == 'user':
                    forbidden_assignees = OrganizationMember.objects.filter(
                        organization=organization,
                        user_id__in=assignees,
                        role__in=['admin', 'owner']
                    ).exists()
                    if forbidden_assignees:
                        task.delete()
                        return Response({"error": "Regular users cannot assign tasks to Admins or Owners."}, status=403)

                task.assignees.set(assignees)

            if task.visibility_type == 'specific':
                member = OrganizationMember.objects.filter(
                    organization=organization, user=request.user).first()
                if member and member.role == 'user':
                    from users.models import User
                    management_users = User.objects.filter(
                        memberships__organization=organization,
                        memberships__role__in=['admin', 'owner']
                    )
                    for mgmt_user in management_users:
                        task.visible_to.add(mgmt_user)

                task.visible_to.add(request.user)
                if assignees:
                    for user_id in assignees:
                        task.visible_to.add(user_id)

            if task.goal:
                task.goal.update_progress()

            from activity_logs.models import ActivityLog
            try:
                ActivityLog.objects.create(
                    user=request.user,
                    organization=organization,
                    action="Created Task",
                    target_type="Task",
                    target_id=str(task.id),
                    description=f"Created task: {task.title}"
                )
            except Exception as e:
                print(f"FAILED TO LOG ACTIVITY: {e}")

            return Response({
                "message": "Task created successfully with multiple assignees!",
                "task": TaskSerializer(task).data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=400)


class TaskListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        organization = get_object_or_404(Organization, id=org_id)

        # Security: Verify membership
        if not OrganizationMember.objects.filter(organization=organization, user=request.user).exists():
            return Response({"error": "Unauthorized access to this workspace's tasks"}, status=403)

        tasks = Task.objects.filter(
            organization=organization, is_deleted=False
        ).select_related('goal', 'created_by').prefetch_related('assignees', 'visible_to')
        return Response(TaskSerializer(tasks, many=True).data)


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        membership = OrganizationMember.objects.filter(
            organization=task.organization, user=request.user).first()
        if not membership:
            return Response({"error": "Permission denied"}, status=403)

        if membership.role not in ['owner', 'admin']:
            can_see = Task.objects.filter(id=task_id).filter(
                Q(visibility_type='organization') |
                Q(created_by=request.user) |
                Q(assignees=request.user) |
                Q(visible_to=request.user)
            ).exists()
            if not can_see:
                return Response({"error": "This task is private and has not been shared with you."}, status=403)

        from activity_logs.models import ActivityLog
        try:
            ActivityLog.objects.create(
                user=request.user,
                organization=task.organization,
                action="Viewed Task",
                target_type="Task",
                target_id=str(task.id),
                description=f"Viewed task: {task.title}"
            )
        except Exception:
            pass

        return Response(TaskDetailSerializer(task).data)

    def patch(self, request, task_id):
        return self.update(request, task_id, partial=True)

    def put(self, request, task_id):
        return self.update(request, task_id, partial=False)

    def update(self, request, task_id, partial=False):
        task = get_object_or_404(Task, id=task_id)
        org = task.organization

        is_assignee = task.assignees.filter(id=request.user.id).exists()
        is_creator = task.created_by == request.user
        is_goal_owner = task.goal and task.goal.owner == request.user

        can_edit_any = has_permission(request.user, org, 'task_edit_any')

        if not (is_assignee or is_creator or is_goal_owner or can_edit_any):
            return Response({"error": "You do not have authority to edit this task."}, status=403)

        if 'assignees' in request.data:
            if not (is_creator or is_goal_owner or has_permission(request.user, org, 'task_assign')):
                return Response({"error": "You do not have permission to change assignees."}, status=403)

        serializer = TaskSerializer(task, data=request.data, partial=partial)
        if serializer.is_valid():
            updated_task = serializer.save()

            if updated_task.visibility_type == 'specific':
                creator_membership = OrganizationMember.objects.filter(
                    organization=updated_task.organization, user=updated_task.created_by).first()
                if creator_membership and creator_membership.role == 'user':
                    from users.models import User
                    management_users = User.objects.filter(
                        memberships__organization=updated_task.organization,
                        memberships__role__in=['admin', 'owner']
                    )
                    for mgmt_user in management_users:
                        updated_task.visible_to.add(mgmt_user)

                for assignee in updated_task.assignees.all():
                    updated_task.visible_to.add(assignee)

            if updated_task.goal:
                updated_task.goal.update_progress()

            return Response({"message": "Task updated!", "task": TaskSerializer(updated_task).data})
        return Response(serializer.errors, status=400)

    def delete(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)

        can_delete = has_permission(
            request.user, task.organization, 'task_delete_any')
        is_creator = task.created_by_id == request.user.id
        is_goal_creator = task.goal and task.goal.created_by_id == request.user.id

        if not (can_delete or is_creator or is_goal_creator):
            return Response({"error": "Only Admins, Owners, the Task Creator, or the Goal Creator can delete tasks."}, status=403)

        task.delete()  # Hard delete
        return Response(status=204)


class UpdateTaskStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)

        is_member = OrganizationMember.objects.filter(
            organization=task.organization, user=request.user).exists()
        if not is_member:
            return Response({"error": "You are not a member of this workspace."}, status=403)

        if 'assignees' in request.data:
            is_creator = task.created_by == request.user
            is_goal_owner = task.goal and task.goal.owner == request.user
            new_assignees = request.data.get('assignees')
            if new_assignees is not None:
                new_ids = set()
                for item in new_assignees:
                    if isinstance(item, dict):
                        new_ids.add(str(item.get('id')))
                    else:
                        new_ids.add(str(item))

                current_ids = set(
                    map(str, task.assignees.values_list('id', flat=True)))
                new_ids.discard('None')
                current_ids.discard('None')

                if new_ids != current_ids:
                    if not (is_creator or is_goal_owner or has_permission(request.user, task.organization, 'task_assign')):
                        return Response({
                            "error": "Permission denied: You do not have authority to reassign this task.",
                        }, status=403)

                    request.data['assigned_at'] = timezone.now()

        serializer = TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            task = serializer.save()

            if task.visibility_type == 'specific':
                for assignee in task.assignees.all():
                    task.visible_to.add(assignee)

                creator_membership = OrganizationMember.objects.filter(
                    organization=task.organization, user=task.created_by).first()
                if creator_membership and creator_membership.role == 'user':
                    from users.models import User
                    management_users = User.objects.filter(
                        memberships__organization=task.organization,
                        memberships__role__in=['admin', 'owner']
                    )
                    for mgmt_user in management_users:
                        task.visible_to.add(mgmt_user)

            if task.goal:
                task.goal.update_progress()

            from activity_logs.models import ActivityLog
            try:
                ActivityLog.objects.create(
                    user=request.user,
                    organization=task.organization,
                    action="Updated Task Status",
                    target_type="Task",
                    target_id=str(task.id),
                    description=f"Updated status of task '{task.title}' to {task.status}"
                )
            except Exception:
                pass

            return Response({
                "message": "Task status updated successfully!",
                "task": TaskSerializer(task).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=400)

    def put(self, request, *args, **kwargs):
        return self.patch(request, *args, **kwargs)


class SoftDeleteTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)

        can_delete = has_permission(
            request.user, task.organization, 'task_delete_any')
        is_creator = task.created_by_id == request.user.id
        is_goal_creator = task.goal and task.goal.created_by_id == request.user.id

        if not (can_delete or is_creator or is_goal_creator):
            return Response({"error": "Only Admins, Owners, the Task Creator, or the Goal Creator can delete tasks."}, status=403)

        task.soft_delete()
        if task.goal:
            task.goal.update_progress()
        return Response(status=204)


class TrashView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        tasks = Task.objects.filter(
            organization_id=org_id, is_deleted=True
        ).select_related('goal', 'created_by').prefetch_related('assignees', 'visible_to').order_by('-updated_at')
        return Response(TaskSerializer(tasks, many=True).data)


class RestoreTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        task.restore()
        if task.goal:
            task.goal.update_progress()
        return Response({"message": "Restored"})


class TaskCommentsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        comments = TaskComment.objects.filter(
            task_id=task_id).order_by('created_at')
        # Frontend expects {"comments": [...]}
        return Response({"comments": TaskCommentSerializer(comments, many=True).data})


class CreateTaskCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        # Frontend might send 'comment' or the object
        serializer = TaskCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(task=task, user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class TaskAttachmentUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided"}, status=400)

        attachment = TaskAttachment.objects.create(
            task=task, file=file_obj, file_name=file_obj.name, uploaded_by=request.user)
        return Response(TaskAttachmentSerializer(attachment).data, status=201)


class BulkTaskUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, org_id):
        task_ids = request.data.get('task_ids', [])
        updates = request.data.get('updates', {})
        Task.objects.filter(
            id__in=task_ids, organization_id=org_id).update(**updates)
        return Response({"message": "Updated"})


class QuickAssignTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        task_id = request.data.get('task_id')
        user_id = request.data.get('user_id')
        task = get_object_or_404(Task, id=task_id)
        from users.models import User
        user = get_object_or_404(User, id=user_id)
        task.assignees.add(user)
        return Response({"message": "Assigned"})


class FilteredTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        try:
            queryset = Task.objects.filter(
                organization_id=org_id
            ).select_related('goal', 'created_by').prefetch_related('assignees', 'visible_to')

            status_param = request.query_params.get('status')
            priority = request.query_params.get('priority')
            assignee = request.query_params.get('assignee')

            if status_param:
                queryset = queryset.filter(status=status_param)
            if priority:
                queryset = queryset.filter(priority=priority)
            if assignee:
                queryset = queryset.filter(assignees__id=assignee)

            serializer = TaskSerializer(queryset, many=True)
            return Response({
                "total": queryset.count(),
                "tasks": serializer.data
            })
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class RemoveTaskAssigneeView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
            assignee_id = request.data.get('assignee_id')
            task.assignees.remove(assignee_id)
            return Response({"message": "Assignee removed successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=400)
