from rest_framework import serializers
from invitations.models import Invitation, InvitationTimeline, InvitationTemplate

class InvitationSerializer(serializers.ModelSerializer):
    """
    Standard serializer for viewing invitations in the dashboard.
    Includes nested data like organization name to prevent extra API calls.
    """
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    invited_by_name = serializers.CharField(source='invited_by.get_full_name', read_only=True)
    
    class Meta:
        model = Invitation
        fields = [
            'id', 'email', 'first_name', 'last_name', 'organization', 'organization_name', 
            'invited_by', 'invited_by_name', 'role', 'message', 
            'status', 'resend_count', 'expires_at', 'created_at',
            'last_sent_at', 'viewed_at', 'accepted_at', 'declined_at'
        ]
        read_only_fields = [
            'id', 'status', 'resend_count', 'created_at', 
            'last_sent_at', 'viewed_at', 'accepted_at', 'declined_at'
        ]

class InvitationCreateSerializer(serializers.ModelSerializer):
    """
    Strict serializer used only when creating/sending a new invitation.
    validators=[] bypasses unique_together so the view can use update_or_create.
    """
    class Meta:
        model = Invitation
        fields = ['email', 'first_name', 'last_name', 'organization', 'role', 'message']
        validators = []  # Handled manually in the view with update_or_create

class InvitationTimelineSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    
    class Meta:
        model = InvitationTimeline
        fields = ['id', 'action', 'performed_by_name', 'metadata', 'created_at']
