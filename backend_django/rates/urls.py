from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RateViewSet

router = DefaultRouter()
router.register(r'', RateViewSet, basename='rate')

urlpatterns = [
    path('', include(router.urls)),
]
