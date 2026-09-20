from rest_framework import viewsets
from .models import Rate
from .serializers import RateSerializer

class RateViewSet(viewsets.ModelViewSet):
    queryset = Rate.objects.all().order_by('-updated_at')
    serializer_class = RateSerializer
    filterset_fields = ['type']

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        if not user:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.filter(is_superuser=True).first()
        serializer.save(updated_by=user)

    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        if not user:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.filter(is_superuser=True).first()
        serializer.save(updated_by=user)
