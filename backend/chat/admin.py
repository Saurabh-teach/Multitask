from django.contrib import admin
from chat.models import ChatRoom, ChatRoomMember, Message, UserPresence

admin.site.register(ChatRoom)
admin.site.register(ChatRoomMember)
admin.site.register(Message)
admin.site.register(UserPresence)
