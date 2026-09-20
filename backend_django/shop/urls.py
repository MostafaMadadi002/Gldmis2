from django.urls import path
from .views import ShopInfoView, DashboardView

urlpatterns = [
    path('settings/', ShopInfoView.as_view(), name='shop-settings'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]
