from django.db import models
from django.conf import settings
import uuid

class ChatRoom(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, blank=True, null=True)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name="chat_rooms")
    is_group = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts_chatroom'

    def __str__(self):
        return self.name or f"ChatRoom {self.id}"


class ChatRoomMember(models.Model):
    chatroom = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_memberships")
    role = models.CharField(max_length=10, choices=(("admin", "Admin"), ("user", "User")), default="user")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts_chatroommember'
        unique_together = ("chatroom", "user")


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chatroom = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    content = models.TextField(blank=True, null=True)
    message_type = models.CharField(max_length=10, choices=(("text", "Text"), ("image", "Image"), ("file", "File")), default="text")
    file = models.FileField(upload_to="chat_files/", blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts_message'
        ordering = ["created_at"]


class UserPresence(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="presence")
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts_userpresence'
