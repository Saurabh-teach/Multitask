import os
import django
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from organizations.models import Organization, OrganizationMember
from join_requests.models import JoinRequest
from invitations.models import Invitation
from notifications.services import NotificationService
from django.utils import timezone
from datetime import timedelta
import uuid

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with professional enterprise demo data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Seeding enterprise demo data...')

        # 1. Create/Update Users
        # Password will be set to 'GoalFlow2026!' for all test users
        password = 'GoalFlow2026!'
        
        owner_data = {'email': 'bhangalesaurabh62@gmail.com', 'username': 'saurabh_owner', 'first_name': 'Saurabh', 'last_name': 'Owner'}
        admin_data = {'email': 'bhangalesaurabh20@gmail.com', 'username': 'saurabh_admin', 'first_name': 'Saurabh', 'last_name': 'Admin'}
        user_data = {'email': 'saurabhangale9232@gmail.com', 'username': 'saurabh_user', 'first_name': 'Saurabh', 'last_name': 'Member'}

        def get_or_create_user(data):
            user, created = User.objects.get_or_create(email=data['email'], defaults={
                'username': data['username'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'is_active': True
            })
            if created:
                user.set_password(password)
                user.save()
            return user

        owner = get_or_create_user(owner_data)
        admin = get_or_create_user(admin_data)
        member = get_or_create_user(user_data)

        # 2. Create Sample Organization
        org, created = Organization.objects.get_or_create(
            name="Enterprise Beta Workspace",
            defaults={
                'description': "Professional testing environment for GoalFlow Enterprise features.",
                'city': "San Francisco",
                'website': "https://goalflow.ai",
                'is_public': True
            }
        )
        # Ensure it has a unique email
        if not org.organization_email:
            org.organization_email = "enterprise-beta@goalflow.ai"
            org.save()

        # 3. Assign Roles
        OrganizationMember.objects.get_or_create(organization=org, user=owner, defaults={'role': 'owner'})
        OrganizationMember.objects.get_or_create(organization=org, user=admin, defaults={'role': 'admin'})
        # Normal user is NOT a member yet, we will use them for Join Requests

        # 4. Create Sample Join Request
        JoinRequest.objects.get_or_create(
            user=member,
            organization=org,
            defaults={
                'message': "I'd like to join the Enterprise Beta team to help with testing!",
                'status': 'pending',
                'requested_role': 'user'
            }
        )

        # 5. Create Sample Invitation
        Invitation.objects.get_or_create(
            email="new_hire@example.com",
            organization=org,
            defaults={
                'invited_by': owner,
                'role': 'user',
                'token': str(uuid.uuid4()),
                'expires_at': timezone.now() + timedelta(days=7),
                'status': 'pending'
            }
        )

        # 6. Trigger a Sample Notification for the Owner
        NotificationService.send_notification(
            recipient=owner,
            n_type='join_request',
            title="New Join Request",
            message=f"{member.get_full_name()} wants to join your workspace.",
            link=f"/organizations/mailbox"
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded enterprise demo data!'))
        self.stdout.write(self.style.SUCCESS(f'Users created: {owner.email}, {admin.email}, {member.email}'))
        self.stdout.write(self.style.SUCCESS(f'Default Password: {password}'))
