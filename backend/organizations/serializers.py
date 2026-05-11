from rest_framework import serializers
from organizations.models import Organization, OrganizationMember, JoinRequest
from users.serializers import UserSerializer

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
