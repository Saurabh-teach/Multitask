from rest_framework import serializers
from chat.models import ChatRoom, ChatRoomMember, Message
from users.serializers import ChatUserSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender = ChatUserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'chatroom', 'sender', 'content', 'message_type', 'file', 'created_at']

class ChatRoomSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'organization', 'is_group', 'created_at', 'last_message']
        read_only_fields = ['organization']

    def get_last_message(self, obj):
        last_msg = obj.messages.all().order_by('-created_at').first()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None

class ChatRoomMemberSerializer(serializers.ModelSerializer):
    user = ChatUserSerializer(read_only=True)
    class Meta:
        model = ChatRoomMember
        fields = ['id', 'chatroom', 'user', 'role', 'joined_at']
