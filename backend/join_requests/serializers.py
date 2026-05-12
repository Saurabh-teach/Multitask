from rest_framework import serializers
from join_requests.models import JoinRequest


class JoinRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(
        source='user.get_full_name', read_only=True)
    organization_name = serializers.CharField(
        source='organization.name', read_only=True)

    class Meta:
        model = JoinRequest
        fields = [
            'id', 'user', 'user_name', 'organization', 'organization_name',
            'requested_role', 'message', 'status', 'requested_at',
            'reviewed_at', 'reviewed_by'
        ]
        read_only_fields = ['id', 'status',
                            'requested_at', 'reviewed_at', 'reviewed_by']


class JoinRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer used when a user creates a new join request."""

    class Meta:
        model = JoinRequest
        fields = ['organization', 'requested_role', 'message']

    def validate(self, attrs):
        user = self.context['request'].user
        org = attrs.get('organization')
        if JoinRequest.objects.filter(user=user, organization=org, status='pending').exists():
            raise serializers.ValidationError(
                "You already have a pending request for this organization.")
        return attrs
