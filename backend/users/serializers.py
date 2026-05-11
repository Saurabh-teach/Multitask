from rest_framework import serializers
from users.models import User, OTPVerification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'phone', 
                  'city', 'job_title', 'department', 'profile_picture', 'bio']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    role_choice = serializers.ChoiceField(choices=['owner', 'member'], required=False, default='owner')
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'phone', 'email', 
                  'password', 'password2', 'role_choice']

    def validate(self, attrs):
        p2 = attrs.get('password2')
        if p2 and attrs['password'] != p2:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})
            
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2', None)
        role_choice = validated_data.pop('role_choice', 'owner')
        phone = validated_data.get('phone')
        if phone == "":
            phone = None

        user = User.objects.create_user(
            username=validated_data['username'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email'),
            phone=phone,
            password=validated_data['password']
        )
        return user

class OTPVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTPVerification
        fields = ['phone', 'otp', 'purpose']

class ChatUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']
