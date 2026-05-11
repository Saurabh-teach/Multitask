import random
from django.utils import timezone
from datetime import timedelta
from users.models import User, OTPVerification

class UserService:
    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))

    @staticmethod
    def save_otp(phone, otp, purpose='register'):
        expires_at = timezone.now() + timedelta(minutes=10)
        OTPVerification.objects.update_or_create(
            phone=phone, purpose=purpose,
            defaults={'otp': otp, 'expires_at': expires_at}
        )

    @staticmethod
    def verify_otp(phone, otp, purpose='register'):
        otp_record = OTPVerification.objects.filter(phone=phone, otp=otp, purpose=purpose).first()
        if otp_record and not otp_record.is_expired():
            otp_record.delete()
            return True
        return False
