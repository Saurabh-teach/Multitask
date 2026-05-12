from rest_framework import serializers
from organizations.models import Organization, OrganizationMember
from users.serializers import UserSerializer

class OrganizationSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'description', 'city', 'address', 'website', 
                  'logo', 'is_public', 'created_at', 'member_count']

    def get_member_count(self, obj):
        from calculations.services import OrganizationCalculator
        return OrganizationCalculator.get_member_count(obj)

class OrganizationMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = OrganizationMember
        fields = ['id', 'user', 'role', 'joined_at', 'is_active']

