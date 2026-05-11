from django.urls import path
from chat.views import ChatRoomListView, ChatRoomMessagesView, StartDirectChatView

urlpatterns = [
    path('organizations/<uuid:org_id>/chat-rooms/', ChatRoomListView.as_view(), name='chat-rooms'),
    path('chat-rooms/<uuid:room_id>/history/', ChatRoomMessagesView.as_view(), name='chat-history'),
    path('organizations/<uuid:org_id>/chat/direct/', StartDirectChatView.as_view(), name='direct-chat'),
]
