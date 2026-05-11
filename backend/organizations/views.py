from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
import uuid
from django.utils import timezone
from datetime import timedelta

from organizations.models import Organization, OrganizationMember, Invitation, JoinRequest, InviteCode
from organizations.serializers import (
    OrganizationSerializer, OrganizationMemberSerializer, 
    JoinRequestSerializer, JoinRequestCreateSerializer
)
from users.models import User
from users.serializers import UserSerializer
from core.permissions import has_permission, can_manage_member, ROLE_HIERARCHY, DELEGATABLE_PERMISSIONS
from tasks.models import Task

class SetupWorkspaceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        name = request.data.get('name')
        if not name:
            return Response({"error": "Workspace name is required"}, status=400)

        org = Organization.objects.create(name=name, created_by=request.user)
        OrganizationMember.objects.create(organization=org, user=request.user, role='owner')

        request.user.setup_step = 3
        request.user.save()

        return Response({
            "message": "Workspace created!",
            "organization": OrganizationSerializer(org).data,
            "setup_step": request.user.setup_step
        })

class CreateOrganizationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OrganizationSerializer(data=request.data)
        if serializer.is_valid():
            org = serializer.save(created_by=request.user)
            OrganizationMember.objects.create(organization=org, user=request.user, role='owner')
            return Response({"message": "Organization created!", "organization": OrganizationSerializer(org).data}, status=201)
        return Response(serializer.errors, status=400)

class MyOrganizationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = OrganizationMember.objects.filter(
            user=request.user, is_active=True
        ).select_related('organization').annotate(
            member_count_annotated=Count('organization__members', filter=Q(organization__members__is_active=True), distinct=True),
            goal_count_annotated=Count('organization__goals', distinct=True)
        )
        
        data = []
        for m in memberships:
            org_data = UserSerializer(request.user).data
            org_data.update({
                "id": str(m.organization.id),
                "organization_id": str(m.organization.id),
                "organization_name": m.organization.name,
                "role": m.role,
                "member_count": m.member_count_annotated,
                "goal_count": m.goal_count_annotated,
                "joined_at": m.joined_at,
                "user_id": str(request.user.id),
            })
            data.append(org_data)
        return Response({"total_organizations": len(data), "organizations": data})

class OrganizationMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        try:
            organization = Organization.objects.get(id=org_id)
            members = OrganizationMember.objects.filter(
                organization=organization, 
                is_active=True
            ).select_related('user').annotate(
                assigned_tasks_count=Count(
                    'user__assigned_tasks', 
                    filter=Q(user__assigned_tasks__organization=organization, user__assigned_tasks__is_deleted=False),
                    distinct=True
                ),
                completed_tasks_count=Count(
                    'user__assigned_tasks', 
                    filter=Q(user__assigned_tasks__organization=organization, user__assigned_tasks__is_deleted=False, user__assigned_tasks__status='done'),
                    distinct=True
                )
            )

            member_data = []
            for member in members:
                assigned = member.assigned_tasks_count
                completed = member.completed_tasks_count
                rate = round((completed / assigned * 100), 1) if assigned > 0 else 0

                active_task_titles = list(Task.objects.filter(
                    organization=organization, assignees=member.user, is_deleted=False
                ).exclude(status='done').values_list('title', flat=True)[:3])

                member_data.append({
                    "id": str(member.id),
                    "user_id": str(member.user.id),
                    "username": member.user.username,
                    "full_name": member.user.get_full_name() or member.user.username,
                    "email": member.user.email,
                    "role": member.role,
                    "permissions": member.permissions or {},
                    "assigned_tasks": assigned,
                    "completed_tasks": completed,
                    "completion_rate": rate,
                    "active_tasks": active_task_titles
                })

            return Response({
                "organization_id": str(organization.id),
                "organization_name": organization.name,
                "members": member_data
            })
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found"}, status=404)

class UpdateMemberPermissionsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, org_id, member_id):
        try:
            org = Organization.objects.get(id=org_id)
            receiver_member = OrganizationMember.objects.get(id=member_id, organization=org)
            granter_member = OrganizationMember.objects.get(user=request.user, organization=org)

            if not can_manage_member(request.user, receiver_member.user, org):
                return Response({"error": "Insufficient permissions"}, status=403)

            new_role = request.data.get('role')
            if new_role:
                if new_role not in ROLE_HIERARCHY:
                    return Response({"error": "Invalid role"}, status=400)
                if ROLE_HIERARCHY[new_role] >= ROLE_HIERARCHY[granter_member.role] and granter_member.role != 'owner':
                    return Response({"error": "Cannot promote to same or higher level"}, status=403)
                receiver_member.role = new_role

            new_permissions = request.data.get('permissions')
            if isinstance(new_permissions, dict):
                allowed = DELEGATABLE_PERMISSIONS.get(granter_member.role, [])
                if allowed != '__all__':
                    for perm in new_permissions.keys():
                        if perm not in allowed:
                            return Response({"error": f"Cannot delegate {perm}"}, status=403)
                
                current = receiver_member.permissions or {}
                current.update(new_permissions)
                receiver_member.permissions = current

            receiver_member.save()
            return Response({"message": "Permissions updated", "member": {"id": str(receiver_member.id), "role": receiver_member.role, "permissions": receiver_member.permissions}})
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class InviteTeamView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, org_id):
        org = get_object_or_404(Organization, id=org_id)
        emails = request.data.get('emails', [])
        tokens = []
        for email in emails:
            token = str(uuid.uuid4())
            Invitation.objects.create(email=email, organization=org, invited_by=request.user, token=token, expires_at=timezone.now() + timedelta(days=7))
            
            print("\n" + "="*50)
            print(f"NEW INVITATION GENERATED")
            print(f"TO: {email}")
            print(f"LINK: http://localhost:3000/join/{token}")
            print("="*50 + "\n")
            
            tokens.append({"email": email, "token": token})

        request.user.setup_step = 5
        request.user.save()
        return Response({"message": f"Sent {len(tokens)} invitations", "setup_step": request.user.setup_step, "tokens": tokens})

class JoinWorkspaceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, token):
        print(f"\n[JOIN ATTEMPT] Received Token: {token}")

        already_accepted = Invitation.objects.filter(token__iexact=token, status='accepted').first()
        if already_accepted:
             print(f"[JOIN] Already accepted for {already_accepted.organization.name}")
             return Response({
                "message": f"You are already a member of {already_accepted.organization.name}",
                "organization_id": already_accepted.organization.id
            })

        try:
            invitation = Invitation.objects.get(token__iexact=token, status='pending')
            print(f"[JOIN] Found pending invite for {invitation.email}")
        except Invitation.DoesNotExist:
            print(f"[JOIN] ERROR: Token {token} not found in database!")
            return Response({"error": "Invalid or expired invitation link."}, status=404)
        
        if invitation.is_expired():
            print(f"[JOIN] ERROR: Token {token} is expired!")
            return Response({"error": "Invitation link has expired"}, status=400)
            
        OrganizationMember.objects.get_or_create(
            organization=invitation.organization,
            user=request.user,
            defaults={'role': invitation.role}
        )
        
        invitation.status = 'accepted'
        invitation.save()
        
        request.user.setup_step = 5
        request.user.save()

        return Response({
            "message": f"Successfully joined {invitation.organization.name}",
            "organization_id": invitation.organization.id
        })

class AvailableTalentView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        employed_user_ids = OrganizationMember.objects.values_list('user_id', flat=True)
        available = User.objects.exclude(id__in=employed_user_ids).exclude(is_superuser=True)
        data = [{'id': u.id, 'username': u.username, 'full_name': u.get_full_name(), 'job_title': u.job_title, 'department': u.department, 'email': u.email} for u in available]
        return Response(data)

class OrganizationUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        org = get_object_or_404(Organization, id=org_id)
        if not OrganizationMember.objects.filter(organization=org, user=request.user).exists():
            return Response({"error": "Permission denied"}, status=403)
        return Response({"message": "Organization details fetched", "data": OrganizationSerializer(org).data})

    def put(self, request, org_id):
        org = get_object_or_404(Organization, id=org_id)
        if not has_permission(request.user, org, 'org_edit'):
            return Response({"error": "Insufficient permissions to edit organization"}, status=403)
        
        serializer = OrganizationSerializer(org, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Organization updated!", "data": serializer.data})
        return Response(serializer.errors, status=400)

class GenerateInviteLinkView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, org_id):
        org = get_object_or_404(Organization, id=org_id)
        if not has_permission(request.user, org, 'member_invite'):
            return Response({"error": "Unauthorized"}, status=403)
        token = str(uuid.uuid4())
        role = request.data.get('role', 'user')
        email = request.data.get('email', 'unspecified@test.com')
        
        Invitation.objects.create(email=email, organization=org, invited_by=request.user, token=token, role=role, expires_at=timezone.now() + timedelta(days=7))
        
        link = f"http://localhost:3000/join/{token}"
        
        print("\n" + "="*50)
        print(f"NEW SHARE LINK GENERATED")
        print(f"ROLE: {role}")
        print(f"LINK: {link}")
        print("="*50 + "\n")
        
        return Response({"invite_link": link, "token": token})

class SendJoinRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = JoinRequestCreateSerializer(data=request.data)
        if serializer.is_valid():
            organization = serializer.validated_data['organization']
            
            if OrganizationMember.objects.filter(organization=organization, user=request.user).exists():
                return Response({"error": "You are already a member"}, status=status.HTTP_400_BAD_REQUEST)
            
            join_request = serializer.save(user=request.user)
            return Response({
                "message": "Join request sent successfully!",
                "request": JoinRequestSerializer(join_request).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ManageJoinRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        join_request = get_object_or_404(JoinRequest, id=request_id)
        
        action = request.data.get('action')
        
        if action == 'approve':
            join_request.status = 'approved'
            join_request.reviewed_by = request.user
            join_request.save()
            
            OrganizationMember.objects.create(
                organization=join_request.organization,
                user=join_request.user,
                role='user'
            )
            return Response({"message": "User approved and added as User"})
            
        elif action == 'reject':
            join_request.status = 'rejected'
            join_request.reviewed_by = request.user
            join_request.save()
            return Response({"message": "Join request rejected"})
        
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

class RemoveMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, member_id):
        try:
            member = OrganizationMember.objects.get(id=member_id)
            if not OrganizationMember.objects.filter(
                organization=member.organization, 
                user=request.user, 
                role__in=['owner', 'admin']
            ).exists():
                return Response({"error": "Permission denied"}, status=403)
            
            member.is_active = False
            member.save()
            return Response({"message": "Member deactivated successfully"})
        except OrganizationMember.DoesNotExist:
            return Response({"error": "Member not found"}, status=404)

class JoinViaInviteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, code):
        try:
            invite = InviteCode.objects.get(code=code, is_active=True)
            if OrganizationMember.objects.filter(organization=invite.organization, user=request.user).exists():
                return Response({"message": "You are already a member"}, status=200)
            
            OrganizationMember.objects.create(
                organization=invite.organization,
                user=request.user,
                role=invite.role
            )
            return Response({"message": f"Successfully joined {invite.organization.name}"})
        except InviteCode.DoesNotExist:
            return Response({"error": "Invalid or expired invite link"}, status=404)
