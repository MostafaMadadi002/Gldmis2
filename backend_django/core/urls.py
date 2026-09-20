from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')), 
    path('api/inventory/', include('inventory.urls')),
    path('api/rates/', include('rates.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/shop/', include('shop.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
