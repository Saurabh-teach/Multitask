from django.urls import path
from users.views import RegisterView, VerifyOTPView, ResendOTPView, LoginView, PersonalizeProfileView, UserProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend_otp'),
    path('login/', LoginView.as_view(), name='login'),
    path('setup/personalize/', PersonalizeProfileView.as_view(), name='setup_personalize'),
    path('profile/', UserProfileView.as_view(), name='profile'),
]
