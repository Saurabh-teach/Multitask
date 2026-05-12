from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import models
from join_requests.models import JoinRequest
from join_requests.serializers import JoinRequestSerializer, JoinRequestCreateSerializer
from organizations.models import OrganizationMember
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from notifications.services import NotificationService

class JoinRequestViewSet(viewsets.ModelViewSet):
    """
    API for users to request access and admins to approve/reject them.
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return JoinRequestCreateSerializer
        return JoinRequestSerializer

    def get_queryset(self):
        user = self.request.user
        qs = JoinRequest.objects.filter(
            models.Q(organization__members__user=user, organization__members__role__in=['owner', 'admin']) |
            models.Q(user=user)
        ).distinct()
        
        org_id = self.request.query_params.get('org_id')
        if org_id:
            qs = qs.filter(organization_id=org_id)
            
        return qs

    def perform_create(self, serializer):
        join_request = serializer.save(user=self.request.user)
        org = join_request.organization
        
        # Notify all Organization Admins/Owners via In-App Notification and Email
        admins = org.members.filter(role__in=['owner', 'admin'])
        admin_emails = []
        for admin in admins:
            if admin.user.email:
                admin_emails.append(admin.user.email)
            NotificationService.send_notification(
                recipient=admin.user,
                n_type='join_request',
                title="New Join Request",
                message=f"{self.request.user.get_full_name() or self.request.user.username} has requested to join {org.name}.",
                link=f"/organizations/{org.id}/settings"
            )

        if admin_emails:
            try:
                send_mail(
                    subject=f"New Join Request for {org.name}",
                    message=f"{self.request.user.get_full_name() or self.request.user.username} ({self.request.user.email}) has requested to join {org.name}.\n\nPlease log in to your GoalFlow Workspace Mailbox to approve or reject this request.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_emails,
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Failed to send internal join request email: {e}")

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        join_request = self.get_object()
        org = join_request.organization
        
        reviewer = org.members.filter(user=request.user).first()
        if not reviewer or reviewer.role not in ['owner', 'admin']:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        if join_request.status != 'pending':
            return Response({"error": "Already processed"}, status=status.HTTP_400_BAD_REQUEST)

        join_request.status = 'approved'
        join_request.reviewed_at = timezone.now()
        join_request.reviewed_by = request.user
        join_request.save()

        OrganizationMember.objects.get_or_create(
            organization=org,
            user=join_request.user,
            defaults={'role': join_request.requested_role}
        )

        # 🚀 Send Branded Welcome Email
        context = {
            'org_name': org.name,
            'user_name': join_request.user.get_full_name() or join_request.user.username,
        }
        html_message = render_to_string('join_requests/welcome_email.html', context)
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject=f"Welcome to {org.name}!",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[join_request.user.email],
            html_message=html_message,
            fail_silently=False,
        )

        NotificationService.send_notification(
            recipient=join_request.user,
            n_type='system',
            title="Request Approved!",
            message=f"You have been approved to join {org.name} as a {join_request.requested_role}.",
            link=f"/dashboard"
        )

        return Response({"message": f"Approved! {join_request.user.username} is now a member."})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        join_request = self.get_object()
        
        reviewer = join_request.organization.members.filter(user=request.user).first()
        if not reviewer or reviewer.role not in ['owner', 'admin']:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        join_request.status = 'rejected'
        join_request.reviewed_at = timezone.now()
        join_request.reviewed_by = request.user
        join_request.save()

        NotificationService.send_notification(
            recipient=join_request.user,
            n_type='system',
            title="Request Rejected",
            message=f"Your request to join {join_request.organization.name} was declined.",
        )
        
        return Response({"message": "Join request rejected."})
