from django.urls import path, include
from rest_framework.routers import DefaultRouter
from join_requests.views import JoinRequestViewSet
from join_requests.public_views import PublicOrganizationInquiryView

router = DefaultRouter()
router.register(r'requests', JoinRequestViewSet, basename='join-request')

urlpatterns = [
    path('', include(router.urls)),
    path('public/inquiry/', PublicOrganizationInquiryView.as_view(), name='public-org-inquiry'),
]
