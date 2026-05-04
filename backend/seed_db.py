import os
import django
import uuid
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from accounts.models import User, Organization, OrganizationMember, Goal, Task

def seed_db():
    print("Starting Enterprise-Grade Database Seeding...")
    
    # 1. Create Professional Users
    users_data = [
        {'username': 'Saurabh101', 'email': f'saurabh_{uuid.uuid4().hex[:4]}@goalflow.com', 'first_name': 'Saurabh', 'last_name': 'Sharma', 'job_title': 'Product Owner', 'department': 'Management'},
        {'username': 'AmitDev', 'email': f'amit_{uuid.uuid4().hex[:4]}@goalflow.com', 'first_name': 'Amit', 'last_name': 'Verma', 'job_title': 'Senior Engineer', 'department': 'Engineering'},
        {'username': 'PriyaUX', 'email': f'priya_{uuid.uuid4().hex[:4]}@goalflow.com', 'first_name': 'Priya', 'last_name': 'Singh', 'job_title': 'UI/UX Designer', 'department': 'Design'},
        {'username': 'RahulQA', 'email': f'rahul_{uuid.uuid4().hex[:4]}@goalflow.com', 'first_name': 'Rahul', 'last_name': 'Kumar', 'job_title': 'QA Lead', 'department': 'Quality'},
    ]

    # Create the specific requested user
    s_user, created = User.objects.get_or_create(
        username='Saurabh_B',
        defaults={
            'email': 'saurabhangale5756@gmail.com',
            'first_name': 'Saurabh',
            'last_name': 'Bhangale',
            'is_active': True
        }
    )
    if created:
        s_user.set_password('Saurabh@123')
        s_user.save()
    
    # Create "Unassigned" Talent
    talent_data = [
        {'username': 'Vikram_Cloud', 'email': 'vikram@talent.com', 'first_name': 'Vikram', 'last_name': 'Rao', 'job_title': 'DevOps Architect'},
        {'username': 'Ananya_Data', 'email': 'ananya@talent.com', 'first_name': 'Ananya', 'last_name': 'Das', 'job_title': 'Data Scientist'},
    ]
    for t in talent_data:
        u, created = User.objects.get_or_create(username=t['username'], defaults={'email': t['email'], 'first_name': t['first_name'], 'last_name': t['last_name'], 'job_title': t['job_title']})
        if created:
            u.set_password('Talent@123')
            u.save()

    users = []
    for u_data in users_data:
        user, created = User.objects.get_or_create(
            username=u_data['username']
        )
        if created:
            user.email = u_data['email']
            user.first_name = u_data['first_name']
            user.last_name = u_data['last_name']
            user.job_title = u_data['job_title']
            user.department = u_data['department']
            user.set_password('Saurabh@123')
            user.save()
        users.append(user)
    
    owner = users[0]
    team = users[1:]

    # 2. Create Professional Organization
    org, created = Organization.objects.get_or_create(
        name="Global Tech Solutions",
        defaults={
            'description': "Enterprise-level software development and strategic consulting firm.",
            'city': "San Francisco",
            'website': "https://techsolutions.com",
            'created_by': owner
        }
    )
    print(f"Workspace: {org.name}")

    # 3. Setup Team Structure
    OrganizationMember.objects.get_or_create(organization=org, user=owner, defaults={'role': 'owner'})
    for member in team:
        OrganizationMember.objects.get_or_create(organization=org, user=member, defaults={'role': 'member'})

    # 4. Create Strategic Epics (Goals)
    epics_data = [
        {
            'title': "Q3 SaaS Platform Overhaul",
            'desc': "Complete redesign of the core SaaS interface to support enterprise multi-tenancy and advanced analytics.",
            'owner': owner,
            'priority': 'high',
            'status': 'in_progress',
            'due': timezone.now() + timedelta(days=90)
        },
        {
            'title': "Market Expansion - Europe",
            'desc': "Establish digital presence and compliance frameworks for expansion into EU markets (GDPR compliance).",
            'owner': team[0],
            'priority': 'medium',
            'status': 'not_started',
            'due': timezone.now() + timedelta(days=120)
        }
    ]

    epics = []
    for e in epics_data:
        epic = Goal.objects.create(
            organization=org,
            title=e['title'],
            description=e['desc'],
            owner=e['owner'],
            priority=e['priority'],
            status=e['status'],
            due_date=e['due']
        )
        epics.append(epic)
    print("Strategic Epics Established.")

    # 5. Create Detailed Tasks (Sprint Items)
    tasks_data = [
        # SaaS Overhaul Tasks
        {'title': "Implement OAuth2.0 SSO", 'status': 'done', 'pri': 'urgent', 'type': 'task', 'epic': epics[0], 'assignee': users[1]},
        {'title': "Redesign Dashboard Layout", 'status': 'in_review', 'pri': 'high', 'type': 'story', 'epic': epics[0], 'assignee': users[2]},
        {'title': "Database Migration to PostgreSQL", 'status': 'in_progress', 'pri': 'high', 'type': 'task', 'epic': epics[0], 'assignee': users[1]},
        {'title': "Setup CI/CD Pipeline", 'status': 'todo', 'pri': 'medium', 'type': 'task', 'epic': epics[0], 'assignee': users[3]},
        {'title': "Fix CSS break on Safari", 'status': 'testing', 'pri': 'high', 'type': 'bug', 'epic': epics[0], 'assignee': users[2]},
        
        # Expansion Tasks
        {'title': "GDPR Data Processing Audit", 'status': 'backlog', 'pri': 'urgent', 'type': 'task', 'epic': epics[1], 'assignee': users[1]},
        {'title': "Localized Landing Pages (FR/DE)", 'status': 'todo', 'pri': 'medium', 'type': 'story', 'epic': epics[1], 'assignee': users[2]},
    ]

    for t in tasks_data:
        task = Task.objects.create(
            organization=org,
            goal=t['epic'],
            title=t['title'],
            issue_type=t['type'],
            status=t['status'],
            priority=t['pri'],
            due_date=timezone.now() + timedelta(days=14),
            created_by=owner
        )
        task.assignees.add(t['assignee'])
    
    # 6. Final Progress Sync
    for epic in epics:
        epic.update_progress()

    print("Seeding Complete! Application is now populated with Jira-style data.")
    print(f"Login: Saurabh101 / Saurabh@123")

if __name__ == '__main__':
    seed_db()
