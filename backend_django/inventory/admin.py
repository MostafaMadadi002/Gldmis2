from django.contrib import admin
from .models import Country, Product

@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ['name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'material', 'weight', 'quantity', 'is_returned']
    list_filter = ['material', 'is_returned', 'country']
    search_fields = ['code', 'name']
