from rest_framework import serializers
from .models import (
    User, Organization, OrganizationMember, OTPVerification, 
    JoinRequest, Goal, Task, TaskComment, TaskAttachment, ActivityLog
)


# ====================== AUTH ======================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'phone', 
                  'city', 'job_title', 'department', 'profile_picture', 'bio']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    role_choice = serializers.ChoiceField(choices=['owner', 'member'], required=True)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'phone', 'email', 
                  'password', 'password2', 'role_choice']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        role_choice = validated_data.pop('role_choice')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email'),
            phone=validated_data.get('phone'),
            password=validated_data['password']
        )
        return user


class OTPVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTPVerification
        fields = ['phone', 'otp', 'purpose']


# ====================== ORGANIZATION ======================
class OrganizationSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'description', 'city', 'address', 'website', 
                  'logo', 'is_public', 'created_at', 'member_count']

    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()


class OrganizationMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = OrganizationMember
        fields = ['id', 'user', 'role', 'joined_at', 'is_active']


# ====================== JOIN REQUEST ======================
class JoinRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    organization = OrganizationSerializer(read_only=True)
    
    class Meta:
        model = JoinRequest
        fields = ['id', 'organization', 'user', 'message', 'status', 
                  'requested_at', 'reviewed_at']
        read_only_fields = ['status', 'reviewed_at']


class JoinRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JoinRequest
        fields = ['organization', 'message']


# ====================== PHASE 3 - GOALS & TASKS ======================
class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = ['id', 'title', 'description', 'owner', 'start_date', 
                  'due_date', 'progress', 'status', 'priority', 
                  'created_at', 'updated_at']
        read_only_fields = ['progress', 'created_at', 'updated_at']


class TaskCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_id = serializers.UUIDField(source='user.id', read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'user_id', 'user_name', 'comment', 'created_at']
        read_only_fields = ['user_id', 'user_name', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    assignees = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        many=True, 
        required=False
    )
    assignee_details = serializers.SerializerMethodField()
    completion_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = ['id', 'goal', 'issue_type', 'title', 'description', 'assignees',
                  'assignee_details', 'status', 'priority', 'due_date', 'estimated_hours',
                  'created_at', 'updated_at', 'completion_date']
        read_only_fields = ['created_at', 'updated_at']

    def get_assignee_details(self, obj):
        return [{"id": str(user.id), "name": user.get_full_name() or user.username, "initial": (user.username[0] if user.username else 'U').upper()} 
                for user in obj.assignees.all()]

    def get_completion_date(self, obj):
        if obj.status == 'done':
            return obj.updated_at.strftime("%d %b %Y")
        return None


class TaskUpdateSerializer(serializers.ModelSerializer):
    assignees = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        many=True, 
        required=False
    )
    
    class Meta:
        model = Task
        fields = ['title', 'description', 'status', 'priority', 
                  'due_date', 'estimated_hours', 'assignees']


class TaskDetailSerializer(serializers.ModelSerializer):
    comments = TaskCommentSerializer(many=True, read_only=True)
    assignee_details = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'goal', 'title', 'description', 'assignees', 
                  'assignee_details', 'status', 'priority', 'due_date', 
                  'estimated_hours', 'comments', 'created_at', 'updated_at']

    def get_assignee_details(self, obj):
        return [{"id": user.id, "name": user.get_full_name() or user.username} 
                for user in obj.assignees.all()]


class GoalDetailSerializer(serializers.ModelSerializer):
    tasks = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)

    class Meta:
        model = Goal
        fields = ['id', 'title', 'description', 'owner', 'owner_name', 'start_date', 
                  'due_date', 'progress', 'status', 'priority', 'tasks', 
                  'created_at', 'updated_at']

    def get_tasks(self, obj):
        return TaskSerializer(obj.tasks.all(), many=True).data
    
    
    
class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = TaskAttachment
        fields = ['id', 'task', 'file', 'file_name', 'uploaded_by_name', 'uploaded_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'user_name', 'action', 'target_type', 
                  'target_id', 'description', 'created_at']


class SearchSerializer(serializers.Serializer):
    query = serializers.CharField(required=True)    