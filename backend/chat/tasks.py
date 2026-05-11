from celery import shared_task
from django.utils import timezone
from chat.models import Message

@shared_task
def cleanup_old_messages(days=30):
    cutoff = timezone.now() - timezone.timedelta(days=days)
    deleted_count, _ = Message.objects.filter(created_at__lt=cutoff).delete()
    return f"Deleted {deleted_count} old messages."

@shared_task
def send_chat_notification(user_id, message_content):
    print(f"Sending notification to User {user_id}: {message_content[:20]}...")
    return True
