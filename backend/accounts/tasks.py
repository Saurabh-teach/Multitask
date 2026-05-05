from celery import shared_task
from django.utils import timezone
from .models import Message, ChatRoom

@shared_task
def cleanup_old_messages(days=30):
    """Example Celery task to delete messages older than X days"""
    cutoff = timezone.now() - timezone.timedelta(days=days)
    deleted_count, _ = Message.objects.filter(created_at__lt=cutoff).delete()
    return f"Deleted {deleted_count} old messages."

@shared_task
def send_chat_notification(user_id, message_content):
    """Example task to send notifications (e.g. Email or Push)"""
    # In a real app, you would integrate an Email or SMS service here
    print(f"Sending notification to User {user_id}: {message_content[:20]}...")
    return True
