from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
import random
import os
from dotenv import load_dotenv
load_dotenv()

from twilio.rest import Client
from django.shortcuts import get_object_or_404
import uuid

from .models import User, Organization, OrganizationMember, OTPVerification, JoinRequest, Task, Goal, TaskComment, InviteCode, OrganizationMember, TaskAttachment, ActivityLog, ChatRoom, Message, ChatRoomMember
from .serializers import (
    RegisterSerializer, 
    UserSerializer, 
    OTPVerificationSerializer, 
    OrganizationSerializer, 
    OrganizationMemberSerializer, 
    JoinRequestSerializer, 
    JoinRequestCreateSerializer,
    GoalSerializer, 
    TaskSerializer, 
    TaskCommentSerializer,
    GoalDetailSerializer,
    TaskUpdateSerializer,
    TaskDetailSerializer,
    TaskAttachmentSerializer,
    ActivityLogSerializer,
    ChatRoomSerializer,
    MessageSerializer,
    ChatRoomMemberSerializer
)

TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN else None
print(f"[Twilio] Client ready: {bool(client)} | SID ends: {TWILIO_ACCOUNT_SID[-4:] if TWILIO_ACCOUNT_SID else 'NONE'}")

def generate_otp():
    return str(random.randint(100000, 999999))

def format_phone_for_twilio(phone):
    """Ensure phone number has proper country code for Twilio."""
    phone = str(phone).strip().replace(' ', '').replace('-', '')
    if phone.startswith('+'):
        return phone
    if phone.startswith('0'):
        phone = phone[1:]
    if len(phone) == 10:
        return f'+91{phone}'
    return f'+{phone}'

def send_otp_via_twilio(phone, otp):
    formatted_phone = format_phone_for_twilio(phone)
    if not client:
        print(f"\n{'='*50}")
        print(f"[DEV MODE - No Twilio] OTP for {formatted_phone}: {otp}")
        print(f"{'='*50}\n")
        return otp

    try:
        print(f"[Twilio] Sending OTP to {formatted_phone}...")
        message = client.messages.create(
            body=f"Your GoalFlow OTP is: {otp}. Valid for 10 minutes. Do not share this with anyone.",
            from_=TWILIO_PHONE_NUMBER,
            to=formatted_phone
        )
        print(f"[Twilio] OTP Sent! SID: {message.sid}")
        return None
    except Exception as e:
        print(f"[Twilio] Error sending to {formatted_phone}: {e}")
        return otp

def log_activity(user, organization, action, target_type, target_id, description):
    try:
        from .models import ActivityLog
        ActivityLog.objects.create(
            user=user if user and user.is_authenticated else None,
            organization=organization,
            action=action,
            target_type=target_type,
            target_id=target_id,
            description=description
        )
    except Exception as e:
        print(f"FAILED TO LOG ACTIVITY: {e}")

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile updated successfully!", "user": serializer.data})
        return Response(serializer.errors, status=400)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            otp = generate_otp()
            expires_at = timezone.now() + timezone.timedelta(minutes=10)

            OTPVerification.objects.create(
                phone=user.phone, otp=otp, expires_at=expires_at, purpose='register'
            )
            send_otp_via_twilio(user.phone, otp)

            return Response({
                "message": "Registration successful. OTP sent.",
                "phone": user.phone
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        otp = request.data.get('otp')

        if not phone or not otp:
            return Response({"error": "Phone and OTP are required"}, status=400)

        try:
            DUMMY_TEST_EMAILS = [
                'rahul@goalflow.com', 'priya@goalflow.com', 'amit@goalflow.com',
                'neha@goalflow.com', 'vikram@goalflow.com', 'sneha@goalflow.com'
            ]
            DUMMY_TEST_PHONES = ['+919999999999']
            
            if (phone in DUMMY_TEST_EMAILS or phone in DUMMY_TEST_PHONES) and otp == '123456':
                otp_obj = type('obj', (object,), {
                    'purpose': 'login', 
                    'delete': lambda *a, **k: None, 
                    'is_expired': lambda *a, **k: False
                })()
            else:
                from django.db.models import Q
                otp_obj = OTPVerification.objects.filter(
                    Q(phone=phone) | Q(phone=phone.replace('+91', '')) | Q(phone=f'+91{phone}'),
                    otp=otp
                ).order_by('-created_at').first()

            if not otp_obj:
                return Response({"error": "Invalid OTP. Please check and try again."}, status=400)

            if otp_obj.is_expired():
                return Response({"error": "OTP has expired. Please request a new one."}, status=400)

            from django.db.models import Q
            user = User.objects.filter(
                Q(phone=phone) | Q(email=phone) | 
                Q(phone=phone.replace('+91', '')) | Q(phone=f'+91{phone}')
            ).first()
            if not user:
                return Response({"error": "User not found for this identifier"}, status=400)

            if otp_obj.purpose == 'register':
                if not OrganizationMember.objects.filter(user=user).exists():
                    org = Organization.objects.create(
                        name=f"{user.get_full_name() or 'My'} Team",
                        created_by=user
                    )
                    OrganizationMember.objects.create(
                        organization=org,
                        user=user,
                        role='owner'
                    )

            otp_obj.delete()

            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)

            return Response({
                "message": "Verification successful!",
                "user": UserSerializer(user).data,
                "token": str(refresh.access_token),
                "refresh": str(refresh)
            }, status=200)

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        if not phone:
            return Response({"error": "Phone number is required"}, status=400)

        try:
            user = User.objects.get(phone=phone)

            OTPVerification.objects.filter(phone=phone, purpose='register').delete()

            otp = generate_otp()
            expires_at = timezone.now() + timezone.timedelta(minutes=10)

            OTPVerification.objects.create(
                phone=phone,
                otp=otp,
                expires_at=expires_at,
                purpose='register'
            )

            print(f"New OTP for {phone} → {otp}")

            return Response({
                "message": "New OTP sent successfully",
                "phone": phone
            }, status=200)

        except User.DoesNotExist:
            return Response({"error": "No account found with this phone"}, status=404)
        except Exception as e:
            return Response({"error": "Failed to resend OTP"}, status=400)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print(f"DEBUG: Login Attempt for: {request.data.get('username')}")
        username = (request.data.get('username') or request.data.get('phone', '')).strip()
        password = request.data.get('password', '').strip()

        try:
            from django.db.models import Q
            user = User.objects.filter(Q(username__iexact=username) | Q(email__iexact=username)).first()
            
            if not user:
                return Response({"error": "No account found with this username/email"}, status=404)

            if user.check_password(password):
                DUMMY_TEST_ACCOUNTS = [
                    'rahul@goalflow.com', 'priya@goalflow.com', 'amit@goalflow.com',
                    'neha@goalflow.com', 'vikram@goalflow.com', 'sneha@goalflow.com',
                    'saurabhangale9332@gmail.com', 'Saurabh101', 'rahul_dev'
                ]
                
                # Allow test accounts to pass for developer testing
                is_test_account = user.email in DUMMY_TEST_ACCOUNTS or user.username in DUMMY_TEST_ACCOUNTS or user.phone == '+919999999999'
                
                if is_test_account:
                    from rest_framework_simplejwt.tokens import RefreshToken
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        "message": "Direct login successful!",
                        "user": UserSerializer(user).data,
                        "token": str(refresh.access_token),
                        "refresh": str(refresh),
                        "step": "dashboard"
                    }, status=200)

                otp = generate_otp()
                expires_at = timezone.now() + timezone.timedelta(minutes=10)
                identifier = user.phone or user.email
                
                phone_bare = identifier.replace('+91', '')
                OTPVerification.objects.filter(
                    phone__in=[identifier, phone_bare, f'+91{phone_bare}'],
                    purpose='login'
                ).delete()
                
                OTPVerification.objects.create(phone=identifier, otp=otp, expires_at=expires_at, purpose='login')
                print(f"\n{'='*50}")
                print(f"[Login] NEW OTP for {identifier}: {otp}")
                print(f"{'='*50}\n")
                
                if user.phone:
                    send_otp_via_twilio(user.phone, otp)
                
                dev_otp = otp

                response_data = {
                    "message": "Password correct! OTP sent to your phone.",
                    "phone": user.phone or user.email,
                    "step": "otp",
                    "dev_otp": dev_otp,
                    "dev_note": "Check your SMS. OTP also shown here as backup."
                }

                return Response(response_data)
            return Response({"error": "Incorrect password. Please try again."}, status=401)
        except Exception as e:
            import traceback
            print(f"LOGIN CRITICAL ERROR: {str(e)}")
            traceback.print_exc()
            return Response({"error": f"Internal Server Error: {str(e)}"}, status=500)

class AvailableTalentView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        employed_user_ids = OrganizationMember.objects.values_list('user_id', flat=True)
        available_talent = User.objects.exclude(id__in=employed_user_ids).exclude(is_superuser=True)
        
        data = []
        for user in available_talent:
            data.append({
                'id': user.id,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}".strip(),
                'job_title': user.job_title,
                'department': user.department,
                'email': user.email
            })
        return Response(data)

class CreateOrganizationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OrganizationSerializer(data=request.data)
        if serializer.is_valid():
            org = serializer.save(created_by=request.user)
            OrganizationMember.objects.create(organization=org, user=request.user, role='owner')
            return Response({"message": "Organization created!", "organization": OrganizationSerializer(org).data}, 
                          status=201)
        return Response(serializer.errors, status=400)

class MyOrganizationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = OrganizationMember.objects.filter(
            user=request.user, is_active=True
        ).select_related('organization')
        
        owner_orgs = memberships.filter(role='owner')
        if owner_orgs.exists():
            memberships = owner_orgs

        data = []
        for m in memberships:
            total = OrganizationMember.objects.filter(organization=m.organization, is_active=True).count()
            goal_count = m.organization.goals.count()
            data.append({
                "organization_id": str(m.organization.id),
                "organization_name": m.organization.name,
                "role": m.role,
                "member_count": total,
                "goal_count": goal_count,
                "joined_at": m.joined_at,
                "first_name": request.user.first_name,
                "last_name": request.user.last_name,
                "username": request.user.username,
                "email": request.user.email,
                "phone": request.user.phone,
                "job_title": request.user.job_title,
                "department": request.user.department,
                "city": request.user.city,
                "bio": request.user.bio
            })
        return Response({"total_organizations": len(data), "organizations": data})

class OrganizationMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        try:
            organization = Organization.objects.get(id=org_id)
            
            members = OrganizationMember.objects.filter(
                organization=organization, 
                is_active=True
            ).select_related('user')

            member_data = []
            for member in members:
                assigned_tasks = Task.objects.filter(
                    organization=organization, 
                    assignees=member.user
                ).count()

                completed_tasks = Task.objects.filter(
                    organization=organization, 
                    assignees=member.user,
                    status='done'
                ).count()

                completion_rate = round((completed_tasks / assigned_tasks * 100), 1) if assigned_tasks > 0 else 0

                active_task_titles = list(Task.objects.filter(
                    organization=organization,
                    assignees=member.user
                ).exclude(status='done').values_list('title', flat=True)[:3])

                member_data.append({
                    "member_id": str(member.id),
                    "user_id": str(member.user.id),
                    "username": member.user.username,
                    "full_name": member.user.get_full_name() or member.user.username,
                    "email": member.user.email,
                    "phone": member.user.phone,
                    "job_title": member.user.job_title,
                    "department": member.user.department,
                    "role": member.role,
                    "joined_at": member.joined_at.strftime("%Y-%m-%d"),
                    "is_active": member.is_active,
                    "tasks_assigned": assigned_tasks,
                    "tasks_completed": completed_tasks,
                    "completion_rate": f"{completion_rate}%",
                    "active_tasks": active_task_titles
                })

            return Response({
                "organization_id": str(organization.id),
                "organization_name": organization.name,
                "total_members": len(member_data),
                "members": member_data
            })

        except Organization.DoesNotExist:
            return Response({"error": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)

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
                role='member'
            )
            return Response({"message": "User approved and added as Member"})
            
        elif action == 'reject':
            join_request.status = 'rejected'
            join_request.reviewed_by = request.user
            join_request.save()
            return Response({"message": "Join request rejected"})
        
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

class UpdateOrganizationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        try:
            org = Organization.objects.get(id=org_id)
            if not OrganizationMember.objects.filter(organization=org, user=request.user).exists():
                return Response({"error": "Permission denied"}, status=403)
            
            serializer = OrganizationSerializer(org)
            return Response({"data": serializer.data})
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found"}, status=404)

    def put(self, request, org_id):
        try:
            org = Organization.objects.get(id=org_id)
            if not OrganizationMember.objects.filter(
                organization=org, 
                user=request.user, 
                role__in=['owner', 'admin']
            ).exists():
                return Response({"error": "Permission denied"}, status=403)
            
            serializer = OrganizationSerializer(org, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"message": "Organization updated successfully", "data": serializer.data})
            return Response(serializer.errors, status=400)
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found"}, status=404)

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

class GenerateInviteLinkView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, org_id):
        try:
            org = Organization.objects.get(id=org_id)
            code = uuid.uuid4().hex[:10].upper()
            invite = InviteCode.objects.create(
                organization=org,
                created_by=request.user,
                code=code,
                role=request.data.get('role', 'member')
            )
            link = f"http://localhost:3002/join/{code}"
            return Response({"invite_link": link, "code": code})
        except Exception as e:
            return Response({"error": str(e)}, status=400)

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
        
class CreateGoalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, org_id):
        try:
            organization = Organization.objects.get(id=org_id)
            current_user = request.user

            member = OrganizationMember.objects.filter(
                organization=organization, 
                user=current_user, 
                role__in=['owner', 'admin', 'manager']
            ).first()
            
            if not member:
                return Response({"error": "Only Owners, Admins, or Managers can create Strategic Epics."}, status=403)

            data = request.data.copy()
            owner_id = data.get('owner')
            owner = current_user
            if owner_id:
                try:
                    owner = User.objects.get(id=owner_id)
                    data['owner'] = str(owner.id)
                except (User.DoesNotExist, ValueError):
                    data.pop('owner', None)

            serializer = GoalSerializer(data=data)
            if serializer.is_valid():
                goal = serializer.save(
                    organization=organization,
                    owner=owner,
                    created_by=current_user
                )
                
                log_activity(
                    current_user, organization, "Created Epic", "Goal", goal.id,
                    f"Created a new epic: {goal.title}"
                )
                
                return Response({
                    "message": "Goal created successfully!",
                    "goal": GoalSerializer(goal).data
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=400)
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class GoalListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, org_id):
        try:
            organization = Organization.objects.get(id=org_id)
            
            if not OrganizationMember.objects.filter(organization=organization, user=request.user).exists():
                return Response({"error": "Permission denied"}, status=403)

            goals = Goal.objects.filter(organization=organization)
            return Response(GoalSerializer(goals, many=True).data)
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found"}, status=404)

class CreateTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, goal_id):
        try:
            goal = Goal.objects.get(id=goal_id)
            organization = goal.organization
            
            is_authorized = OrganizationMember.objects.filter(
                organization=organization, 
                user=request.user, 
                role__in=['owner', 'admin', 'manager']
            ).exists()
            
            if not is_authorized:
                return Response({"error": "Only Owners, Admins, or Managers can create tasks."}, status=403)

            serializer = TaskSerializer(data=request.data)
            if serializer.is_valid():
                task = serializer.save(
                    goal=goal,
                    organization=organization,
                    created_by=request.user
                )
                
                assignees = request.data.get('assignees', [])
                if assignees:
                    task.assignees.set(assignees)

                return Response({
                    "message": "Task created successfully with multiple assignees!",
                    "task": TaskSerializer(task).data
                }, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=400)

        except Goal.DoesNotExist:
            return Response({"error": "Goal not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class TaskListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        try:
            organization = Organization.objects.get(id=org_id)
            
            if not OrganizationMember.objects.filter(organization=organization, user=request.user).exists():
                return Response({"error": "Permission denied"}, status=403)

            tasks = Task.objects.filter(organization=organization)
            return Response(TaskSerializer(tasks, many=True).data)
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found"}, status=404)        
        
class UpdateTaskStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
            
            is_assignee = task.assignees.filter(id=request.user.id).exists()
            
            has_privilege = OrganizationMember.objects.filter(
                organization=task.organization, 
                user=request.user, 
                role__in=['owner', 'admin', 'manager']
            ).exists()
            
            if not (is_assignee or has_privilege):
                return Response({
                    "error": "Access Denied. You can only update tasks assigned to you, or tasks where you have a Managerial/Admin role."
                }, status=403)

            serializer = TaskSerializer(task, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                
                if task.goal:
                    task.goal.update_progress()
                
                log_activity(
                    request.user, task.organization, "Updated Task Status", "Task", task.id,
                    f"Updated status of task '{task.title}' to {task.status}"
                )

                return Response({
                    "message": "Task status updated successfully!",
                    "task": TaskSerializer(task).data
                }, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=400)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
            if not OrganizationMember.objects.filter(organization=task.organization, user=request.user).exists():
                return Response({"error": "Permission denied"}, status=403)
            
            log_activity(request.user, task.organization, "Viewed Task", "Task", task.id, f"Viewed task: {task.title}")
            return Response(TaskDetailSerializer(task).data)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=404)

    def put(self, request, task_id):
        return self.update(request, task_id, partial=False)

    def patch(self, request, task_id):
        return self.update(request, task_id, partial=True)

    def update(self, request, task_id, partial=False):
        try:
            task = Task.objects.get(id=task_id)
            is_assignee = task.assignees.filter(id=request.user.id).exists()
            is_privileged = OrganizationMember.objects.filter(
                organization=task.organization, user=request.user, 
                role__in=['owner', 'admin', 'manager']
            ).exists()
            
            if not (is_assignee or is_privileged):
                return Response({"error": "Permission denied"}, status=403)

            serializer = TaskUpdateSerializer(task, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                if task.goal:
                    task.goal.update_progress()
                return Response({"message": "Task updated!", "task": TaskSerializer(task).data})
            return Response(serializer.errors, status=400)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=404)

    def delete(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
            is_privileged = OrganizationMember.objects.filter(
                organization=task.organization, user=request.user, 
                role__in=['owner', 'admin', 'manager']
            ).exists()
            if not is_privileged:
                return Response({"error": "Only admins/managers can delete tasks."}, status=403)

            goal = task.goal
            task.delete()
            if goal:
                goal.update_progress()
            return Response({"message": "Task deleted"}, status=204)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=404)
        
class CreateTaskCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
            if not OrganizationMember.objects.filter(organization=task.organization, user=request.user).exists():
                return Response({"error": "Permission denied"}, status=403)

            data = request.data.copy()
            data['task'] = task.id
            data['user'] = request.user.id

            serializer = TaskCommentSerializer(data=data)
            if serializer.is_valid():
                comment = serializer.save()
                return Response({
                    "message": "Comment added successfully!",
                    "comment": TaskCommentSerializer(comment).data
                }, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=400)
        
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=404)

class TaskCommentsListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
            comments = task.comments.all()
            serializer = TaskCommentSerializer(comments, many=True)
            return Response({
                "task_id": task_id,
                "total_comments": comments.count(),
                "comments": serializer.data
            })
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=404)          
        
class GoalDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, goal_id):
        try:
            goal = Goal.objects.get(id=goal_id)
            if not OrganizationMember.objects.filter(organization=goal.organization, user=request.user).exists():
                return Response({"error": "Permission denied"}, status=403)
            
            goal.update_progress()
            return Response(GoalDetailSerializer(goal).data)
        except Goal.DoesNotExist:
            return Response({"error": "Goal not found"}, status=404)

class DeleteGoalView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, goal_id):
        try:
            goal = Goal.objects.get(id=goal_id)
            is_authorized = OrganizationMember.objects.filter(
                organization=goal.organization, 
                user=request.user, 
                role__in=['owner', 'admin']
            ).exists()
            
            if not is_authorized:
                return Response({"error": "Only the Organization Owner or Admin can delete Epics."}, status=403)

            goal.delete()
            return Response({"message": "Epic deleted successfully!"}, status=204)
        except Goal.DoesNotExist:
            return Response({"error": "Epic not found"}, status=404)

class FilteredTasksView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, org_id):
        try:
            queryset = Task.objects.filter(organization_id=org_id)
            
            status = request.query_params.get('status')
            priority = request.query_params.get('priority')
            assignee = request.query_params.get('assignee')

            if status:
                queryset = queryset.filter(status=status)
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
        
class ActivityLogView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, org_id):
        logs = ActivityLog.objects.filter(organization_id=org_id).order_by('-created_at')[:50]
        serializer = ActivityLogSerializer(logs, many=True)
        return Response({
            "total": logs.count(),
            "logs": serializer.data
        })

class TaskAttachmentUploadView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
            file = request.FILES.get('file')
            
            if not file:
                return Response({"error": "No file uploaded"}, status=400)

            current_user = request.user if request.user.is_authenticated else User.objects.first()

            attachment = TaskAttachment.objects.create(
                task=task,
                file=file,
                file_name=file.name,
                uploaded_by=current_user
            )
            
            log_activity(
                current_user, task.organization, "Uploaded Attachment", "Task", task.id,
                f"Uploaded '{file.name}' to task: {task.title}"
            )
            
            return Response({
                "message": "File uploaded successfully!",
                "attachment": TaskAttachmentSerializer(attachment).data
            }, status=201)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class GlobalSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, org_id):
        query = request.query_params.get('q', '')
        if not query:
            return Response({"results": []})

        goals = Goal.objects.filter(
            organization_id=org_id, 
            title__icontains=query,
            is_deleted=False
        )[:10]

        tasks = Task.objects.filter(
            organization_id=org_id,
            title__icontains=query,
            is_deleted=False
        )[:10]

        return Response({
            "goals": GoalSerializer(goals, many=True).data,
            "tasks": TaskSerializer(tasks, many=True).data
        })

class BulkTaskUpdateView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, org_id):
        task_ids = request.data.get('task_ids', [])
        updates = request.data.get('updates', {})

        tasks = Task.objects.filter(id__in=task_ids, organization_id=org_id)
        updated_count = tasks.update(**updates)

        return Response({
            "message": f"{updated_count} tasks updated successfully",
            "updated_count": updated_count
        })

class RemoveTaskAssigneeView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
            assignee_id = request.data.get('assignee_id')
            task.assignees.remove(assignee_id)
            return Response({"message": "Assignee removed successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class SoftDeleteTaskView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
            task.soft_delete()
            return Response({"message": "Task moved to trash successfully"}, status=204)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=404)         

class DashboardStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, org_id):
        try:
            org = Organization.objects.get(id=org_id)
            
            active_goals = Goal.objects.filter(organization=org).exclude(status='completed').count()
            
            open_tasks = Task.objects.filter(organization=org).exclude(status='done').count()
            
            total_tasks = Task.objects.filter(organization=org).count()
            done_tasks = Task.objects.filter(organization=org, status='done').count()
            completion = int((done_tasks / total_tasks * 100) if total_tasks > 0 else 0)
            
            team_members = OrganizationMember.objects.filter(organization=org, is_active=True).count()
            
            activity_qs = ActivityLog.objects.filter(organization=org).order_by('-created_at')[:10]
            recent_activity = ActivityLogSerializer(activity_qs, many=True).data
            
            recent_goals_qs = Goal.objects.filter(organization=org).order_by('-created_at')[:5]
            recent_goals = [{"id": str(g.id), "title": g.title, "status": g.status, "progress": g.progress} for g in recent_goals_qs]
            
            user = request.user
            my_tasks = []
            
            if not OrganizationMember.objects.filter(organization=org, user=request.user).exists():
                return Response({"error": "Permission denied"}, status=403)

            if user.is_authenticated:
                my_tasks_qs = Task.objects.filter(organization=org).exclude(status='done').order_by('due_date')[:5]
                my_tasks = [{"id": str(t.id), "title": t.title, "status": t.status, "priority": t.priority} for t in my_tasks_qs]
            
            return Response({
                "activeGoals": active_goals,
                "openTasks": open_tasks,
                "completion": completion,
                "teamMembers": team_members,
                "recentGoals": recent_goals,
                "myTasks": my_tasks,
                "recentActivity": recent_activity
            }, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class QuickAssignTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.data.get('user_id')
        org_id = request.data.get('organization_id')
        goal_id = request.data.get('goal_id')
        task_id = request.data.get('task_id')

        if not user_id or not org_id:
            return Response({"error": "User and Organization are required"}, status=400)

        try:
            user = User.objects.get(id=user_id)
            organization = Organization.objects.get(id=org_id)
            
            is_authorized = OrganizationMember.objects.filter(
                organization=organization, 
                user=request.user, 
                role__in=['owner', 'admin', 'manager']
            ).exists()
            
            if not is_authorized:
                return Response({"error": "Only Owners, Admins, or Managers can assign work or hire talent."}, status=403)

            member, created = OrganizationMember.objects.get_or_create(
                organization=organization,
                user=user,
                defaults={'role': 'member'}
            )

            if task_id:
                task = Task.objects.get(id=task_id, organization=organization)
                task.assignees.add(user)
                
                log_activity(
                    request.user, organization, "Quick Assign", "Task", task.id,
                    f"Assigned {user.username} to task: {task.title}"
                )
                
                return Response({
                    "message": f"Successfully assigned {user.username} to {task.title}",
                    "member": str(member.id)
                })

            return Response({
                "message": f"Added {user.username} to {organization.name}",
                "member": str(member.id)
            })

        except Exception as e:
            return Response({"error": str(e)}, status=400)


class ChatRoomListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, org_id):
        rooms = ChatRoom.objects.filter(organization_id=org_id)
        serializer = ChatRoomSerializer(rooms, many=True)
        return Response(serializer.data)

    def post(self, request, org_id):
        serializer = ChatRoomSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(organization_id=org_id)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
class MessageHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, room_id):
        messages = Message.objects.filter(chatroom_id=room_id).order_by('created_at')[:50]
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
