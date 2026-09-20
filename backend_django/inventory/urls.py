from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CountryViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'countries', CountryViewSet, basename='country')

urlpatterns = [
    path('', include(router.urls)),
]
