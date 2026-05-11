import os
import django
import uuid
from datetime import timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User
from organizations.models import Organization, OrganizationMember
from goals.models import Goal
from tasks.models import Task

def seed_indian_data():
    print("Cleaning database...")
    Task.objects.all().delete()
    Goal.objects.all().delete()
    OrganizationMember.objects.all().delete()
    Organization.objects.all().delete()
    User.objects.filter(is_superuser=False).delete()

    print("Starting Multi-Sector Technical Seeding...")

    # 1. Create Owner & Admin
    owner = User.objects.create_user(
        username='rajesh_owner', email='rajesh@bharat.com', password='Pass@123',
        first_name='Rajesh', last_name='Kumar', job_title='Group CTO', department='Leadership'
    )
    admin = User.objects.create_user(
        username='priya_admin', email='priya@bharat.com', password='Pass@123',
        first_name='Priya', last_name='Sharma', job_title='Director of Engineering', department='Leadership'
    )

    # 2. Create 15 Users with Indian Names
    indian_names = [
        ("Amit", "Patel"), ("Suresh", "Raina"), ("Deepika", "Padukone"), ("Arjun", "Kapoor"),
        ("Anjali", "Desai"), ("Vikram", "Seth"), ("Neha", "Gupta"), ("Rohan", "Mehra"),
        ("Sneha", "Reddy"), ("Karan", "Johar"), ("Pooja", "Hegde"), ("Aditya", "Roy"),
        ("Ishani", "Vora"), ("Manish", "Malhotra"), ("Tanvi", "Shah")
    ]
    
    users = []
    for i, (first, last) in enumerate(indian_names):
        u = User.objects.create_user(
            username=f'user_{i+1}', email=f'{first.lower()}.{last.lower()}@tech.in', password='Pass@123',
            first_name=first, last_name=last, job_title='Specialist Engineer', department='Engineering'
        )
        users.append(u)

    # 3. Define Unique Data for Each Organization
    org_data = {
        "Bharat Tech Solutions": {
            "indices": [0, 1, 2, 3], # 6 total
            "goals": [
                {"title": "AI Model Training Pipeline", "tasks": ["Data Cleaning", "Feature Engineering", "Training Job Automation"]},
                {"title": "Predictive Analytics Dashboard", "tasks": ["Grafana Setup", "SQL Optimization", "Real-time Alerts"]}
            ]
        },
        "Indus Innovations": {
            "indices": [0, 4, 5, 6, 7], # 7 total
            "goals": [
                {"title": "iOS E-commerce Launch", "tasks": ["SwiftUI Implementation", "Apple Pay Integration", "App Store Submission"]},
                {"title": "Customer Loyalty Program", "tasks": ["Point Calculation Engine", "Email Marketing API", "Referral Logic"]}
            ]
        },
        "Deccan Digital": {
            "indices": [0, 1, 8, 9, 10, 11, 12], # 9 total
            "goals": [
                {"title": "Cloud Infrastructure Migration", "tasks": ["VPC Setup", "RDS Instance Migration", "Terraform Scripts"]},
                {"title": "Zero Trust Security Audit", "tasks": ["IAM Policy Review", "Network Log Analysis", "Pentesting Report"]}
            ]
        }
    }

    for name, config in org_data.items():
        org = Organization.objects.create(
            name=name,
            description=f"Innovation Center for {name}.",
            city="Bengaluru",
            created_by=owner
        )
        
        # Add Owner and Admin
        OrganizationMember.objects.create(organization=org, user=owner, role='owner')
        OrganizationMember.objects.create(organization=org, user=admin, role='admin')
        
        # Add specific users
        org_users = []
        for idx in config['indices']:
            u = users[idx]
            OrganizationMember.objects.create(organization=org, user=u, role='user')
            org_users.append(u)
        
        # Create Unique Goals & Tasks
        for g_temp in config['goals']:
            goal = Goal.objects.create(
                organization=org, title=g_temp['title'], owner=owner, created_by=owner,
                status='in_progress', priority='high', due_date=timezone.now().date() + timedelta(days=60)
            )
            
            for i, t_title in enumerate(g_temp['tasks']):
                task_user = org_users[i % len(org_users)]
                task = Task.objects.create(
                    organization=org, goal=goal, title=t_title,
                    status='todo', created_by=admin, due_date=timezone.now().date() + timedelta(days=14)
                )
                task.assignees.add(task_user)
        
        print(f"Created Org: {name} | Goals: {len(config['goals'])}")

    print("\n" + "="*50)
    print("UNIQUE MULTI-ORG SEEDING COMPLETE")
    print("="*50)
    print(f"Owner: rajesh_owner / Pass@123")
    print(f"User 1 (Overlap): user_1 / Pass@123 (Sees AI, iOS, and Cloud goals!)")
    print("="*50)

if __name__ == '__main__':
    seed_indian_data()
