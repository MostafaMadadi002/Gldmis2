from rest_framework import serializers
from .models import ShopInfo

class ShopInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopInfo
        fields = '__all__'
