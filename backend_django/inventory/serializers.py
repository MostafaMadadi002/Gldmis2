import base64
import uuid
from django.core.files.base import ContentFile
from rest_framework import serializers
from .models import Product, Country

class Base64ImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if not data:
            return None
            
        # If it's already a URL (existing image), just return it
        if isinstance(data, str) and (data.startswith('http') or data.startswith('/media/')):
            return None # DRF ImageField will keep existing file if we return None or just ignore it
            
        if isinstance(data, str) and data.startswith('data:image'):
            try:
                format, imgstr = data.split(';base64,')
                ext = format.split('/')[-1]
                data = ContentFile(base64.b64decode(imgstr), name=f"{uuid.uuid4()}.{ext}")
            except Exception:
                raise serializers.ValidationError("فرمت تصویر معتبر نیست.")
                
        return super().to_internal_value(data)

class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    origin = serializers.CharField(write_only=True, required=False, allow_null=True)
    country_name = serializers.ReadOnlyField(source='country.name')
    material_display = serializers.CharField(source='get_material_display', read_only=True)
    stoneType = serializers.CharField(source='stone_type', required=False, allow_null=True)
    minQuantity = serializers.IntegerField(source='min_quantity', required=False, default=1)
    isReturned = serializers.BooleanField(source='is_returned', required=False, default=False)
    secondHandDestination = serializers.CharField(source='second_hand_destination', required=False, allow_null=True)
    purchasePrice = serializers.DecimalField(source='purchase_price', max_digits=14, decimal_places=2, required=False, allow_null=True)
    deductFromMelt = serializers.BooleanField(source='deduct_from_melt', required=False, default=False)
    purchasePricePerGram = serializers.SerializerMethodField()
    image = Base64ImageField(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = [
            'id', 'code', 'name', 'weight', 'material', 'material_display', 'carat', 
            'stoneType', 'origin', 'country_name', 'quantity', 'minQuantity', 'image', 
            'price', 'purchasePrice', 'purchasePricePerGram', 'isReturned', 'secondHandDestination', 'deductFromMelt'
        ]

    def get_purchasePricePerGram(self, obj):
        if obj.purchase_price and obj.weight and obj.weight > 0:
            return float(obj.purchase_price / obj.weight)
        return 0

    def create(self, validated_data):
        origin_name = validated_data.pop('origin', None)
        
        if origin_name:
            country, _ = Country.objects.get_or_create(name=origin_name)
            validated_data['country'] = country
        elif 'country' not in validated_data:
            country, _ = Country.objects.get_or_create(name='نامشخص')
            validated_data['country'] = country
            
        return super().create(validated_data)

    def update(self, instance, validated_data):
        origin_name = validated_data.pop('origin', None)
        
        if origin_name:
            country, _ = Country.objects.get_or_create(name=origin_name)
            validated_data['country'] = country
            
        return super().update(instance, validated_data)

    def validate(self, data):
        # Use existing instance values as fallback for validation
        material = data.get('material', getattr(self.instance, 'material', None) if self.instance else None)
        carat = data.get('carat', getattr(self.instance, 'carat', None) if self.instance else None)
        stone_type = data.get('stone_type', getattr(self.instance, 'stone_type', None) if self.instance else None)

        if material in ['gold', 'silver'] and not carat:
            raise serializers.ValidationError({"carat": "عیار برای طلا و نقره الزامی است."})
        
        if material == 'jewelry' and not stone_type:
            raise serializers.ValidationError({"stoneType": "نوع سنگ برای جواهر الزامی است."})
            
        return data
