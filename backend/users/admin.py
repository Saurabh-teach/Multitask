from django.contrib import admin
from users.models import User, OTPVerification

admin.site.register(User)
admin.site.register(OTPVerification)
