from django.contrib import admin
from .models import Sale, SaleItem

class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ['name_snapshot', 'code_snapshot', 'material_snapshot', 'carat_snapshot', 'stone_snapshot', 'weight', 'quantity', 'price', 'rate_at_sale']

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'customer_name', 'seller', 'total_amount', 'created_at']
    list_filter = ['seller', 'created_at']
    search_fields = ['invoice_number', 'customer_name']
    inlines = [SaleItemInline]
    readonly_fields = ['invoice_number', 'total_amount', 'created_at']
