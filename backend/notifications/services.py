from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from notifications.models import Notification

class NotificationService:
    @staticmethod
    def send_notification(recipient, n_type, title, message, link=None):
        """
        Creates a notification in the database and broadcasts it via WebSockets.
        """
        # 1. Create in Database
        notification = Notification.objects.create(
            recipient=recipient,
            type=n_type,
            title=title,
            message=message,
            link=link
        )

        # 2. Prepare Payload for WebSocket
        payload = {
            "id": str(notification.id),
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "link": notification.link,
            "created_at": notification.created_at.isoformat(),
            "is_read": notification.is_read
        }

        # 3. Broadcast to the user's Channel Group
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{recipient.id}",
            {
                "type": "send_notification",
                "content": payload
            }
        )
        
        return notification
