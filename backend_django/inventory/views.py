from rest_framework import viewsets
from .models import Product, Country
from .serializers import ProductSerializer, CountrySerializer

class CountryViewSet(viewsets.ModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer

    def get_queryset(self):
        qs = Product.objects.all()
        returned = self.request.query_params.get('returned')
        if returned == 'true':
            return qs.filter(is_returned=True)
        if returned == 'false':
            return qs.filter(is_returned=False)
        return qs # Return all products by default for frontend-side filtering

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        if not user:
            # Fallback to first superuser or keep None
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.filter(is_superuser=True).first()
        
        try:
            serializer.save(updated_by=user)
        except TypeError:
            # In case updated_by is not expected by the model yet (no migration)
            serializer.save()

    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        if not user:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.filter(is_superuser=True).first()
            
        try:
            serializer.save(updated_by=user)
        except TypeError:
            serializer.save()
