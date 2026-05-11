from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q

from chat.models import ChatRoom, ChatRoomMember, Message
from organizations.models import Organization
from users.models import User
from chat.serializers import ChatRoomSerializer, MessageSerializer, ChatRoomMemberSerializer

class ChatRoomListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        org = get_object_or_404(Organization, id=org_id)
        # Rooms where user is a member within the org
        rooms = ChatRoom.objects.filter(
            organization=org,
            members__user=request.user
        ).distinct()
        return Response(ChatRoomSerializer(rooms, many=True).data)

class ChatRoomMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        room = get_object_or_404(ChatRoom, id=room_id)
        # Security: check membership
        if not ChatRoomMember.objects.filter(chatroom=room, user=request.user).exists():
            return Response({"error": "Forbidden"}, status=403)
            
        messages = room.messages.all().order_by('created_at')
        return Response(MessageSerializer(messages, many=True).data)

class StartDirectChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, org_id):
        other_user_id = request.data.get('user_id')
        if not other_user_id:
            return Response({"error": "User ID required"}, status=400)
            
        other_user = get_object_or_404(User, id=other_user_id)
        org = get_object_or_404(Organization, id=org_id)
        
        # Check if direct room already exists
        existing_room = ChatRoom.objects.filter(
            organization=org,
            is_group=False,
            members__user=request.user
        ).filter(members__user=other_user).first()
        
        if existing_room:
            return Response(ChatRoomSerializer(existing_room).data)
            
        # Create new room
        room = ChatRoom.objects.create(organization=org, is_group=False)
        ChatRoomMember.objects.create(chatroom=room, user=request.user)
        ChatRoomMember.objects.create(chatroom=room, user=other_user)
        
        return Response(ChatRoomSerializer(room).data, status=201)
