from rest_framework import serializers
from .models import Rate

class RateSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.ReadOnlyField(source='updated_by.username')

    class Meta:
        model = Rate
        fields = '__all__'
