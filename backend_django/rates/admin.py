from django.contrib import admin
from .models import Rate

@admin.register(Rate)
class RateAdmin(admin.ModelAdmin):
    list_display = ['label', 'type', 'value', 'currency', 'updated_by', 'updated_at']
    list_filter = ['type', 'updated_at']
    search_fields = ['label']
