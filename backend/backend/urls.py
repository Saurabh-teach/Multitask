from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include([
        path('', include('dashboard.urls')),
        path('', include('users.urls')),
        path('', include('organizations.urls')),
        path('', include('goals.urls')),
        path('', include('tasks.urls')),
        path('', include('chat.urls')),
        path('', include('activity_logs.urls')),
        path('', include('invitations.urls')),
        path('', include('join_requests.urls')),
        path('', include('notifications.urls')),
    ])),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
