from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import UserSerializer
from .permissions import IsManagerOrSuperUser

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsManagerOrSuperUser]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user

        # Prevent self-deletion
        if instance.id == user.id:
            return Response(
                {"detail": "شما نمی‌توانید حساب کاربری خودتان را حذف کنید."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Superuser cannot be deleted
        if instance.is_superuser:
            return Response(
                {"detail": "حساب سوپریوزر قابل حذف نیست."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Managers (admin role) cannot delete other Managers if they are not superusers
        if not user.is_superuser and instance.role == User.ROLE_ADMIN:
            return Response(
                {"detail": "شما اجازه حذف مدیران دیگر را ندارید."},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().destroy(request, *args, **kwargs)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
