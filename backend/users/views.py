from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
import random
import os
import traceback
from django.utils import timezone
from django.conf import settings
from django.db.models import Q
from twilio.rest import Client

from users.models import User, OTPVerification
from users.serializers import RegisterSerializer, UserSerializer, OTPVerificationSerializer
from organizations.models import Organization, OrganizationMember

# Twilio Config
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN else None

def generate_otp():
    return str(random.randint(100000, 999999))

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.setup_step = 2
            user.save()

            refresh = RefreshToken.for_user(user)

            return Response({
                "message": "Account created successfully.",
                "user": UserSerializer(user).data,
                "token": str(refresh.access_token),
                "refresh": str(refresh),
                "setup_step": user.setup_step
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        otp = request.data.get('otp')

        if not phone or not otp:
            return Response({"error": "Phone and OTP are required"}, status=400)

        DUMMY_TEST_EMAILS = [
            'rahul@goalflow.com', 'priya@goalflow.com', 'amit@goalflow.com', 
            'saurabh@goalflow.com', 'neha@goalflow.com', 'karan@goalflow.com',
            'vikram@goalflow.com', 'pooja@goalflow.com', 'shreya@goalflow.com', 'tanmay@goalflow.com'
        ]

        try:
            # Flexible phone matching
            user = User.objects.filter(
                Q(phone=phone) | Q(email=phone) | 
                Q(phone=phone.replace('+91', '')) | Q(phone=f'+91{phone}')
            ).first()

            if not user:
                return Response({"error": "User not found"}, status=400)

            # Test account bypass
            if user.email in DUMMY_TEST_EMAILS and otp == '123456':
                refresh = RefreshToken.for_user(user)
                return Response({
                    "message": "OTP Verified successfully (Test Mode)",
                    "token": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data
                })

            otp_record = OTPVerification.objects.filter(phone=phone, otp=otp).first()
            if not otp_record or otp_record.is_expired():
                return Response({"error": "Invalid or expired OTP"}, status=400)

            if otp_record.purpose == 'register':
                if not OrganizationMember.objects.filter(user=user).exists():
                    org = Organization.objects.create(
                        name=f"{user.get_full_name() or 'My'} Team",
                        created_by=user
                    )
                    OrganizationMember.objects.create(
                        organization=org,
                        user=user,
                        role='owner'
                    )

            otp_record.delete()
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Verification successful!",
                "user": UserSerializer(user).data,
                "token": str(refresh.access_token),
                "refresh": str(refresh)
            }, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        if not phone:
            return Response({"error": "Phone number is required"}, status=400)

        try:
            user = User.objects.get(phone=phone)
            OTPVerification.objects.filter(phone=phone, purpose='register').delete()

            otp = generate_otp()
            from datetime import timedelta
            expires_at = timezone.now() + timedelta(minutes=10)

            OTPVerification.objects.create(
                phone=phone, otp=otp, expires_at=expires_at, purpose='register'
            )

            print(f"New OTP for {phone} \u2192 {otp}")
            return Response({"message": "New OTP sent successfully", "phone": phone}, status=200)

        except User.DoesNotExist:
            return Response({"error": "No account found with this phone"}, status=404)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get('username') or request.data.get('phone', '')).strip()
        password = request.data.get('password', '').strip()

        try:
            user = User.objects.filter(Q(username__iexact=username) | Q(email__iexact=username)).first()
            
            if not user:
                return Response({"error": "No account found with this username/email"}, status=404)

            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                return Response({
                    "message": "Login successful (Bypassed OTP for testing).",
                    "user": UserSerializer(user).data,
                    "token": str(refresh.access_token),
                    "refresh": str(refresh),
                    "step": "dashboard"
                }, status=200)
            return Response({"error": "Incorrect password. Please try again."}, status=401)
        except Exception as e:
            print(f"LOGIN CRITICAL ERROR: {str(e)}")
            traceback.print_exc()
            return Response({"error": f"Internal Server Error: {str(e)}"}, status=500)

class PersonalizeProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        
        if 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']
            
        user.city = request.data.get('city', user.city)
        user.job_title = request.data.get('job_title', user.job_title)
        user.department = request.data.get('department', user.department)
        user.bio = request.data.get('bio', user.bio)
        
        user.setup_step = 4
        user.save()
        
        from activity_logs.models import ActivityLog
        org_member = OrganizationMember.objects.filter(user=user).first()
        if org_member:
            try:
                ActivityLog.objects.create(
                    user=user,
                    organization=org_member.organization,
                    action="Updated Profile",
                    target_type="User",
                    target_id=str(user.id),
                    description=f"{user.get_full_name() or user.username} personalized their profile."
                )
            except Exception:
                pass
                
        return Response({
            "message": "Profile personalized!", 
            "user": UserSerializer(user).data, 
            "setup_step": user.setup_step
        })

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile updated successfully!", "user": serializer.data})
        return Response(serializer.errors, status=400)

    def put(self, request, *args, **kwargs):
        return self.patch(request, *args, **kwargs)
