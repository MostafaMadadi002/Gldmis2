from django.contrib import admin
from .models import ShopInfo

@admin.register(ShopInfo)
class ShopInfoAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'language', 'theme']
    
    def has_add_permission(self, request):
        # جلوگیری از ساخت رکورد دوم
        if self.model.objects.exists():
            return False
        return super().has_add_permission(request)
