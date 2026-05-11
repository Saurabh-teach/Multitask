from rest_framework import serializers
from tasks.models import Task, TaskComment, TaskAttachment
from users.models import User

class TaskCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_id = serializers.UUIDField(source='user.id', read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'user', 'user_id', 'user_name', 'comment', 'created_at']
        read_only_fields = ['user_id', 'user_name', 'created_at']
        extra_kwargs = {
            'user': {'write_only': True}
        }

class TaskSerializer(serializers.ModelSerializer):
    assignees = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        many=True, 
        required=False
    )
    assignee_details = serializers.SerializerMethodField()
    completion_date = serializers.SerializerMethodField()
    goal_details = serializers.SerializerMethodField()
    creator_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'goal', 'organization', 'goal_details', 'issue_type', 'title', 'description', 'assignees',
                  'assignee_details', 'status', 'priority', 'due_date', 'estimated_hours',
                  'visibility_type', 'visible_to',
                  'created_by', 'creator_name', 'assigned_at', 'created_at', 'updated_at', 'completion_date']
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'assigned_at']

    def get_goal_details(self, obj):
        if obj.goal:
            return {
                "id": str(obj.goal.id), 
                "title": obj.goal.title,
                "created_by": str(obj.goal.created_by_id)
            }
        return None

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
                  'due_date', 'estimated_hours', 'assignees',
                  'visibility_type', 'visible_to']

class TaskDetailSerializer(serializers.ModelSerializer):
    comments = TaskCommentSerializer(many=True, read_only=True)
    assignee_details = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'goal', 'organization', 'title', 'description', 'assignees', 
                  'assignee_details', 'status', 'priority', 'due_date', 
                  'estimated_hours', 'comments', 'created_by', 
                  'visibility_type', 'visible_to',
                  'created_at', 'updated_at']

    def get_assignee_details(self, obj):
        return [{"id": user.id, "name": user.get_full_name() or user.username} 
                for user in obj.assignees.all()]

class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = TaskAttachment
        fields = ['id', 'task', 'file', 'file_name', 'uploaded_by_name', 'uploaded_at']
