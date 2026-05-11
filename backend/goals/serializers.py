from rest_framework import serializers
from goals.models import Goal
from tasks.serializers import TaskSerializer

class GoalSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    
    class Meta:
        model = Goal
        fields = ['id', 'title', 'description', 'organization', 'owner', 'owner_name', 'created_by', 'creator_name', 
                  'start_date', 'due_date', 'progress', 'status', 'priority', 
                  'visibility_type', 'visible_to',
                  'created_at', 'updated_at']
        read_only_fields = ['progress', 'created_at', 'updated_at', 'created_by']

class GoalDetailSerializer(serializers.ModelSerializer):
    tasks = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)

    class Meta:
        model = Goal
        fields = ['id', 'title', 'description', 'organization', 'owner', 'owner_name', 'created_by', 
                  'due_date', 'progress', 'status', 'priority', 'tasks', 
                  'visibility_type', 'visible_to',
                  'created_at', 'updated_at']

    def get_tasks(self, obj):
        return TaskSerializer(obj.tasks.all(), many=True).data
