from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from activity_logs.models import ActivityLog
from organizations.models import Organization
from activity_logs.serializers import ActivityLogSerializer
from core.permissions import has_permission

class ActivityLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, org_id):
        organization = get_object_or_404(Organization, id=org_id)
        
        if not has_permission(request.user, organization, 'view_logs'):
            return Response({"error": "Unauthorized to view activity logs"}, status=403)
            
        logs = ActivityLog.objects.filter(organization=organization).order_by('-created_at')
        return Response(ActivityLogSerializer(logs, many=True).data)
