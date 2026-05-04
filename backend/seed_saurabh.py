import os
import django
import uuid
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from accounts.models import User, Organization, OrganizationMember, Goal, Task

def seed_saurabh_org():
    print("Seeding Saurabh's Organization...")
    
    # Target Org
    org_id = '6f0ed70b-f82d-4f1c-8ac5-7d45970ebe71'
    try:
        org = Organization.objects.get(id=org_id)
        owner = User.objects.get(username='Saurabh101')
    except Exception as e:
        print(f"Error: {e}")
        return

    # 1. Add some employees
    employees_data = [
        {'username': 'rahul_dev', 'email': 'rahul@goalflow.com', 'first_name': 'Rahul', 'last_name': 'Mehta', 'job_title': 'Frontend Engineer'},
        {'username': 'priya_pm', 'email': 'priya@goalflow.com', 'first_name': 'Priya', 'last_name': 'Sharma', 'job_title': 'Product Manager'},
        {'username': 'amit_backend', 'email': 'amit@goalflow.com', 'first_name': 'Amit', 'last_name': 'Verma', 'job_title': 'Backend Developer'},
    ]

    employees = []
    for data in employees_data:
        user, created = User.objects.get_or_create(
            username=data['username'],
            defaults={
                'email': data['email'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'job_title': data['job_title'],
                'is_active': True
            }
        )
        if created:
            user.set_password('Emp@1234')
            user.save()
        
        # Add to Organization
        OrganizationMember.objects.get_or_create(
            organization=org,
            user=user,
            defaults={'role': 'member'}
        )
        employees.append(user)
        print(f"Added employee: {user.username}")

    # 2. Add Goals
    goal1, _ = Goal.objects.get_or_create(
        organization=org,
        title="Scale Infrastructure to 100k Users",
        defaults={
            'description': 'Optimize database and caching for high traffic.',
            'owner': employees[2], # Amit
            'progress': 30.0
        }
    )
    
    goal2, _ = Goal.objects.get_or_create(
        organization=org,
        title="Redesign User Onboarding Flow",
        defaults={
            'description': 'Improve conversion rate by simplifying registration.',
            'owner': employees[1], # Priya
            'progress': 15.0
        }
    )

    # 3. Add and Assign Tasks
    tasks_data = [
        {'goal': goal1, 'title': 'Implement Redis Caching', 'assignee': employees[2], 'status': 'in_progress', 'priority': 'high'},
        {'goal': goal1, 'title': 'Database Migration to Aurora', 'assignee': employees[2], 'status': 'todo', 'priority': 'urgent'},
        {'goal': goal2, 'title': 'Create Figma Mockups', 'assignee': employees[0], 'status': 'done', 'priority': 'medium'},
        {'goal': goal2, 'title': 'Integrate Analytics API', 'assignee': employees[0], 'status': 'in_progress', 'priority': 'high'},
        {'goal': goal2, 'title': 'Write User Feedback Survey', 'assignee': employees[1], 'status': 'todo', 'priority': 'low'},
    ]

    for t_data in tasks_data:
        task, created = Task.objects.get_or_create(
            organization=org,
            goal=t_data['goal'],
            title=t_data['title'],
            defaults={
                'status': t_data['status'],
                'priority': t_data['priority'],
                'created_by': owner
            }
        )
        if created:
            task.assignees.add(t_data['assignee'])
            print(f"Created task: {task.title} (Assigned to {t_data['assignee'].username})")

    print("Seeding complete for Saurabh's Organization!")

if __name__ == '__main__':
    seed_saurabh_org()
