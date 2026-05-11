from organizations.models import Organization, OrganizationMember

class OrganizationService:
    @staticmethod
    def create_workspace(name, user):
        org = Organization.objects.create(name=name, created_by=user)
        OrganizationMember.objects.create(organization=org, user=user, role='owner')
        return org

    @staticmethod
    def is_member(user, organization):
        return OrganizationMember.objects.filter(organization=organization, user=user, is_active=True).exists()
