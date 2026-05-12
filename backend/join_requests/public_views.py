from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from organizations.models import Organization
from join_requests.models import JoinRequest
from django.contrib.auth import get_user_model

User = get_user_model()

class PublicOrganizationInquiryView(APIView):
    """
    Public endpoint for external users to 'send mail' (Join Requests) 
    to an organization using their unique system email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        target_email = request.data.get('to_email')
        sender_email = request.data.get('from_email')
        message = request.data.get('message')

        # 1. Find the organization by their unique internal email
        org = Organization.objects.filter(organization_email=target_email).first()
        if not org:
            return Response({"error": "Organization mailbox not found."}, status=status.HTTP_404_NOT_FOUND)

        # 2. Find or handle the sender
        # If the sender is already a user, we link it. If not, we can flag it for review.
        user = User.objects.filter(email=sender_email).first()
        if not user:
            # For this MVP, we require them to have an account to create a JoinRequest,
            # but we could also store this as a 'Lead' or 'Inquiry' in the future!
            return Response({"error": "Please create a GoalFlow account first to send join requests."}, status=status.HTTP_403_FORBIDDEN)

        # 3. Create the Join Request
        join_request, created = JoinRequest.objects.get_or_create(
            user=user,
            organization=org,
            defaults={'message': message, 'status': 'pending'}
        )

        # 4. Send Real-Time Email to Organization Admins
        if created:
            from django.core.mail import send_mail
            from django.conf import settings
            
            admins = org.members.filter(role__in=['owner', 'admin'])
            admin_emails = [admin.user.email for admin in admins if admin.user.email]
            
            if org.organization_email and org.organization_email not in admin_emails:
                admin_emails.append(org.organization_email)

            if admin_emails:
                try:
                    send_mail(
                        subject=f"New Join Request: {sender_email}",
                        message=f"You have a new join request for {org.name} from {sender_email}.\n\nMessage: {message}\n\nPlease log in to your GoalFlow Workspace Mailbox to approve or reject this request.",
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=admin_emails,
                        fail_silently=True,
                    )
                except Exception as e:
                    print(f"Failed to send join request email: {e}")

        return Response({"message": f"Your message has been delivered to {org.name} admins!"}, status=status.HTTP_201_CREATED)
