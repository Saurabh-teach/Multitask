import os
import django
import uuid
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from accounts.models import User, Organization, OrganizationMember, Goal, Task

def seed_data():
    print("Starting Strategic Seed for 'Saurabh Bhangale Team'...")
    
    # 1. Get or Create Organization
    org_name = "Saurabh Bhangale Team"
    org, created = Organization.objects.get_or_create(
        name=org_name,
        defaults={
            'description': 'High-performance engineering and strategic execution unit.',
            'city': 'San Francisco',
            'is_public': True
        }
    )
    print(f"Organization: {org.name} ({'Created' if created else 'Existing'})")

    # 2. Create 7 Technical Employees
    employees_data = [
        {"user": "alex_cloud", "name": "Alex Rivers", "title": "Cloud Architect"},
        {"user": "sarah_sec", "name": "Sarah Chen", "title": "Security Lead"},
        {"user": "marco_api", "name": "Marco Rossi", "title": "API Developer"},
        {"user": "priya_frontend", "name": "Priya Sharma", "title": "UX Engineer"},
        {"user": "dev_ops_dan", "name": "Dan Miller", "title": "DevOps Specialist"},
        {"user": "jess_data", "name": "Jess Wu", "title": "Data Scientist"},
        {"user": "tom_qa", "name": "Tom Baker", "title": "QA Automation"}
    ]

    members = []
    for emp in employees_data:
        user, u_created = User.objects.get_or_create(
            username=emp['user'],
            defaults={
                'first_name': emp['name'].split()[0],
                'last_name': emp['name'].split()[1],
                'email': f"{emp['user']}@goalflow.ai",
                'job_title': emp['title']
            }
        )
        if u_created:
            user.set_password('password123')
            user.save()
        
        # Add to Org
        member, m_created = OrganizationMember.objects.get_or_create(
            organization=org,
            user=user,
            defaults={'role': 'member'}
        )
        members.append(user)
        print(f"Added Member: {emp['name']} - {emp['title']}")

    # 3. Create 3 Technical Goals
    goals_data = [
        {
            "title": "Cloud Infrastructure Migration",
            "desc": "Moving legacy workloads to a multi-cloud architecture for 99.99% uptime.",
            "priority": "high"
        },
        {
            "title": "API Performance & Security Overhaul",
            "desc": "Implementing OAuth2 and reducing latency by 40% across all endpoints.",
            "priority": "urgent"
        },
        {
            "title": "Next-Gen Mobile UI Framework",
            "desc": "Developing a cross-platform design system for high-velocity front-end delivery.",
            "priority": "medium"
        }
    ]

    goals = []
    owner = User.objects.filter(is_superuser=True).first() or members[0]
    
    for g_data in goals_data:
        goal, g_created = Goal.objects.get_or_create(
            organization=org,
            title=g_data['title'],
            defaults={
                'description': g_data['desc'],
                'owner': owner,
                'priority': g_data['priority'],
                'status': 'in_progress',
                'start_date': datetime.now().date(),
                'due_date': (datetime.now() + timedelta(days=90)).date()
            }
        )
        goals.append(goal)
        print(f"Created Goal: {goal.title}")

    # 4. Create 12 Technical Tasks
    tasks_data = [
        # Cloud Tasks
        {"goal": goals[0], "title": "Audit existing AWS VPC configuration", "type": "task", "status": "done", "assignees": [members[4], members[0]]},
        {"goal": goals[0], "title": "Set up Terraform scripts for staging", "type": "story", "status": "in_progress", "assignees": [members[0]]},
        {"goal": goals[0], "title": "Fix S3 bucket permission leak", "type": "bug", "status": "todo", "assignees": [members[1]]},
        
        # API Tasks
        {"goal": goals[1], "title": "Implement Redis caching layer", "type": "task", "status": "in_progress", "assignees": [members[2], members[5]]},
        {"goal": goals[1], "title": "Refactor auth middleware to OAuth2", "type": "story", "status": "todo", "assignees": [members[1], members[2]]},
        {"goal": goals[1], "title": "Optimize SQL queries for /orders endpoint", "type": "task", "status": "testing", "assignees": [members[2]]},
        {"goal": goals[1], "title": "API documentation auto-generation", "type": "task", "status": "done", "assignees": [members[6]]},

        # UI Tasks
        {"goal": goals[2], "title": "Create reusable Button & Card components", "type": "story", "status": "done", "assignees": [members[3]]},
        {"goal": goals[2], "title": "Integrate TailwindCSS dark mode", "type": "task", "status": "in_progress", "assignees": [members[3]]},
        {"goal": goals[2], "title": "Mobile responsiveness audit", "type": "task", "status": "todo", "assignees": [members[3], members[6]]},
    ]

    for t_data in tasks_data:
        task = Task.objects.create(
            organization=org,
            goal=t_data['goal'],
            title=t_data['title'],
            issue_type=t_data['type'],
            status=t_data['status'],
            priority='medium',
            description=f"Strategic execution item for {t_data['goal'].title}.",
            due_date=(datetime.now() + timedelta(days=14)).date()
        )
        task.assignees.set(t_data['assignees'])
        print(f"Created Task: {task.title}")

    print("\nWorkspace Population Complete! Your Strategic Board is live.")

if __name__ == "__main__":
    seed_data()
