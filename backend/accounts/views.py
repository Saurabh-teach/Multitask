from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.utils import timezone
import random
import os
from twilio.rest import Client

from .models import User, Organization, OrganizationMember, OTPVerification
from .serializers import RegisterSerializer, UserSerializer

# TWILIO setup
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID else None


def generate_otp():
    return str(random.randint(100000, 999999))


def send_otp_via_twilio(phone, otp):
    """Send Real OTP using Twilio"""
    if not client:
        print("Twilio not configured. OTP:", otp)
        return False

    try:
        message = client.messages.create(
            body=f"Your GoalFlow verification code is: {otp}. Valid for 10 minutes only.",
            from_=TWILIO_PHONE_NUMBER,
            to=f"+91{phone}"          
        )
        print(f"Twilio OTP Sent Successfully! SID: {message.sid}")
        return True
    except Exception as e:
        print(f"Twilio Error: {str(e)}")
        return False


# register api
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            otp = generate_otp()
            expires_at = timezone.now() + timezone.timedelta(minutes=10)

            OTPVerification.objects.create(
                phone=user.phone,
                otp=otp,
                expires_at=expires_at,
                purpose='register'
            )

            sent = send_otp_via_twilio(user.phone, otp)

            return Response({
                "message": "User created successfully. OTP sent.",
                "phone": user.phone,
                "user_id": str(user.id)
            }, status=status.HTTP_201_CREATED)

        print("Serializer Errors:", serializer.errors)  
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Verify otp
class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        otp_input = request.data.get('otp')
        role_choice = request.data.get('role_choice')

        try:
            otp_obj = OTPVerification.objects.get(phone=phone, otp=otp_input, purpose='register')

            if otp_obj.is_expired():
                return Response({"error": "OTP has expired. Please request a new one."}, 
                              status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.get(phone=phone)

            if role_choice == 'owner':
                # (Avoid Duplicate)
                base_name = f"{user.get_full_name() or user.username}'s Team"
                org_name = base_name
                counter = 1
                
                while Organization.objects.filter(name=org_name).exists():
                    org_name = f"{base_name} {counter}"
                    counter += 1

                org = Organization.objects.create(
                    name=org_name,
                    created_by=user
                )
                
                OrganizationMember.objects.create(
                    organization=org,
                    user=user,
                    role='owner'
                )

            otp_obj.delete()

            return Response({
                "message": "Verification successful!",
                "user": UserSerializer(user).data,
                "is_owner": role_choice == 'owner'
            })

        except OTPVerification.DoesNotExist:
            return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Login Api 
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username') or request.data.get('phone')
        password = request.data.get('password')

        try:
            # find user by username or phone
            user = User.objects.get(username=username)
            
            if user.check_password(password):
                # Password correct → Send OTP to registered phone
                otp = generate_otp()
                expires_at = timezone.now() + timezone.timedelta(minutes=10)

                OTPVerification.objects.create(
                    phone=user.phone,
                    otp=otp,
                    expires_at=expires_at,
                    purpose='login'
                )

                sent = send_otp_via_twilio(user.phone, otp)

                return Response({
                    "message": "Password correct! OTP sent to your registered phone.",
                    "phone": user.phone,
                    "user": UserSerializer(user).data,
                    "step": "otp"
                })

            else:
                return Response({"error": "Wrong password"}, status=status.HTTP_401_UNAUTHORIZED)

        except User.DoesNotExist:
            return Response({"error": "No account found with this username"}, 
                          status=status.HTTP_404_NOT_FOUND)