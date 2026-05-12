from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import models
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import uuid

from invitations.models import Invitation, InvitationTimeline
from invitations.serializers import InvitationSerializer, InvitationCreateSerializer
from notifications.services import NotificationService

class InvitationViewSet(viewsets.ModelViewSet):
    """
    API endpoints for managing workspace invitations.
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Invitation.objects.filter(
            models.Q(organization__members__user=user) | 
            models.Q(email=user.email)
        ).distinct()

    def get_serializer_class(self):
        if self.action == 'create':
            return InvitationCreateSerializer
        return InvitationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        organization = serializer.validated_data['organization']
        
        member = organization.members.filter(user=request.user).first()
        if not member or member.role.lower() not in ['owner', 'admin']:
            return Response({"error": "Only owners or admins can send invitations."}, status=status.HTTP_403_FORBIDDEN)
            
        requested_role = serializer.validated_data.get('role', 'user').lower()
        if member.role.lower() == 'admin' and requested_role in ['owner', 'admin']:
            return Response({"error": "Admins cannot invite other Admins or Owners."}, status=status.HTTP_403_FORBIDDEN)
            
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email=email, memberships__organization=organization).exists():
            return Response({"error": "This person is already a member of this workspace."}, status=status.HTTP_400_BAD_REQUEST)

        # update_or_create handles re-sending to the same email gracefully
        invitation, _ = Invitation.objects.update_or_create(
            email=email,
            organization=organization,
            defaults={
                'invited_by': request.user,
                'first_name': serializer.validated_data.get('first_name', ''),
                'last_name': serializer.validated_data.get('last_name', ''),
                'role': serializer.validated_data.get('role', 'user'),
                'message': serializer.validated_data.get('message', ''),
                'token': str(uuid.uuid4()),
                'status': 'pending',
                'expires_at': timezone.now() + timedelta(days=7),
            }
        )

        
        InvitationTimeline.objects.create(
            invitation=invitation,
            action='sent',
            performed_by=request.user
        )

        # Dispatch Branded HTML Email
        org = invitation.organization
        inviter = request.user
        invite_link = f"{settings.FRONTEND_URL}/join/{invitation.token}"
        
        context = {
            'org_name': org.name,
            'org_logo': org.logo.url if org.logo else None,
            'org_website': org.website,
            'inviter_name': f"{inviter.first_name} {inviter.last_name}".strip() or inviter.username,
            'invite_link': invite_link,
            'role': invitation.role,
            'custom_message': invitation.message
        }
        
        try:
            html_message = render_to_string('invitations/email_template.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=f"Invitation to join {org.name}",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[invitation.email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send invitation email: {str(e)}")
            # We still return 201 because the invitation record was created/updated in the DB
            return Response({
                "message": "Invitation created in database, but email delivery failed. Please check SMTP settings.",
                "invitation": InvitationSerializer(invitation).data,
                "warning": "email_failed"
            }, status=status.HTTP_201_CREATED)
        
        return Response(InvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        invitation = self.get_object()
        
        if invitation.email != request.user.email:
            return Response({"error": "You can only accept invitations sent to your email."}, status=status.HTTP_403_FORBIDDEN)
            
        if invitation.status != 'pending' or invitation.is_expired():
            return Response({"error": "Invitation is invalid or has expired."}, status=status.HTTP_400_BAD_REQUEST)

        invitation.status = 'accepted'
        invitation.accepted_at = timezone.now()
        invitation.save()
        
        InvitationTimeline.objects.create(
            invitation=invitation,
            action='accepted',
            performed_by=request.user
        )

        # Notify Admins/Owners that user has accepted
        org = invitation.organization
        admins = org.members.filter(role__in=['owner', 'admin'])
        for admin in admins:
            NotificationService.send_notification(
                recipient=admin.user,
                n_type='system',
                title="Invitation Accepted!",
                message=f"{request.user.username} has accepted the invitation to {org.name}. Finalize to grant access.",
                link=f"/members"
            )
        
        return Response({"message": "Invitation accepted! Waiting for administrator finalization."})

    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        invitation = self.get_object()
        org = invitation.organization
        
        # Check if requester is Admin/Owner
        reviewer = org.members.filter(user=request.user).first()
        if not reviewer or reviewer.role not in ['owner', 'admin']:
            return Response({"error": "Only admins can finalize memberships."}, status=status.HTTP_403_FORBIDDEN)

        if invitation.status != 'accepted':
            return Response({"error": "This invitation has not been accepted by the user yet."}, status=status.HTTP_400_BAD_REQUEST)

        # Finalize Membership
        from organizations.models import OrganizationMember
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        target_user = User.objects.filter(email=invitation.email).first()
        if not target_user:
            return Response({"error": "User account not found."}, status=status.HTTP_404_NOT_FOUND)

        OrganizationMember.objects.get_or_create(
            organization=org,
            user=target_user,
            defaults={'role': invitation.role}
        )

        invitation.status = 'finalized'
        invitation.confirmed_at = timezone.now()
        invitation.save()

        InvitationTimeline.objects.create(
            invitation=invitation,
            action='finalized',
            performed_by=request.user
        )

        # Notify the User
        NotificationService.send_notification(
            recipient=target_user,
            n_type='system',
            title="Membership Finalized!",
            message=f"Welcome to {org.name}! Your membership is now active.",
            link=f"/dashboard"
        )
        
        return Response({"message": f"Successfully finalized membership for {target_user.username}."})

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        emails = request.data.get('emails', [])
        organization_id = request.data.get('organization')
        role = request.data.get('role', 'user')
        message = request.data.get('message', '')

        if not emails or not organization_id:
            return Response({"error": "emails list and organization are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        from organizations.models import Organization
        org = Organization.objects.filter(id=organization_id).first()
        if not org:
            return Response({"error": "Organization not found."}, status=status.HTTP_404_NOT_FOUND)

        member = org.members.filter(user=request.user).first()
        if not member or member.role.lower() not in ['owner', 'admin']:
            return Response({"error": "Only owners or admins can send invitations."}, status=status.HTTP_403_FORBIDDEN)

        if member.role.lower() == 'admin' and role.lower() in ['owner', 'admin']:
            return Response({"error": "Admins cannot invite other Admins or Owners."}, status=status.HTTP_403_FORBIDDEN)

        results = []
        for email in emails:
            # We simulate the create logic here or call a service
            # For simplicity, update_or_create
            invitation, _ = Invitation.objects.update_or_create(
                email=email,
                organization=org,
                defaults={
                    'invited_by': request.user,
                    'role': role,
                    'message': message,
                    'token': str(uuid.uuid4()),
                    'status': 'pending',
                    'expires_at': timezone.now() + timedelta(days=7),
                }
            )
            InvitationTimeline.objects.create(invitation=invitation, action='sent', performed_by=request.user)
            results.append(invitation.id)
            
        return Response({"message": f"Successfully sent {len(results)} invitations."}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        invitation = self.get_object()
        org = invitation.organization
        
        member = org.members.filter(user=request.user).first()
        if not member or member.role.lower() not in ['owner', 'admin']:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        invitation.resend_count += 1
        invitation.last_sent_at = timezone.now()
        invitation.expires_at = timezone.now() + timedelta(days=7)
        invitation.status = 'pending'
        invitation.save()

        InvitationTimeline.objects.create(invitation=invitation, action='resent', performed_by=request.user)

        # Trigger email again
        invite_link = f"{settings.FRONTEND_URL}/join/{invitation.token}"
        context = {
            'org_name': org.name,
            'org_logo': org.logo.url if org.logo else None,
            'org_website': org.website,
            'inviter_name': request.user.get_full_name() or request.user.username,
            'invite_link': invite_link,
            'role': invitation.role,
            'custom_message': invitation.message
        }
        
        try:
            html_message = render_to_string('invitations/email_template.html', context)
            plain_message = strip_tags(html_message)
            send_mail(
                subject=f"Reminder: Invitation to join {org.name}",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[invitation.email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            return Response({"message": "Resent in DB, but email failed."}, status=status.HTTP_200_OK)

        return Response({"message": "Invitation resent successfully!"})

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        org_id = request.query_params.get('org_id')
        if not org_id:
            return Response({"error": "org_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        qs = Invitation.objects.filter(organization_id=org_id)
        
        return Response({
            "total_sent": qs.count(),
            "pending": qs.filter(status='pending').count(),
            "accepted": qs.filter(status='accepted').count(),
            "declined": qs.filter(status='declined').count(),
            "finalized": qs.filter(status='finalized').count(),
            "expired": qs.filter(expires_at__lt=timezone.now(), status='pending').count(),
        })
