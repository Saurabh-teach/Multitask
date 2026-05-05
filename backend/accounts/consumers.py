import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, Message, UserPresence, User
from django.utils import timezone

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['group_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope["user"]

        if self.user.is_authenticated:
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
            # Update Presence
            await self.update_user_presence(True)
        else:
            await self.close()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            # Update Presence
            await self.update_user_presence(False)
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'message':
            message = data.get('message')
            # Save message to DB
            saved_msg = await self.save_message(message)
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'id': str(saved_msg.id),
                    'message': message,
                    'sender': {
                        'id': str(self.user.id),
                        'username': self.user.username
                    },
                    'timestamp': str(saved_msg.created_at)
                }
            )
        
        elif action == 'typing':
            is_typing = data.get('is_typing')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_typing',
                    'user': self.user.username,
                    'is_typing': is_typing
                }
            )

        elif action == 'mark_read':
            await self.mark_messages_read()

    # Receive message from room group
    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def user_typing(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def save_message(self, message):
        room = ChatRoom.objects.get(id=self.room_id)
        return Message.objects.create(
            chatroom=room,
            sender=self.user,
            content=message
        )

    @database_sync_to_async
    def update_user_presence(self, is_online):
        presence, _ = UserPresence.objects.get_or_create(user=self.user)
        presence.is_online = is_online
        presence.last_seen = timezone.now()
        presence.save()

    @database_sync_to_async
    def mark_messages_read(self):
        Message.objects.filter(
            chatroom_id=self.room_id, 
            is_read=False
        ).exclude(sender=self.user).update(is_read=True)
