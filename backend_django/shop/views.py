from rest_framework import generics, views, permissions
from rest_framework.response import Response
from django.db.models import Sum, F
from django.db.models.functions import Coalesce
from django.utils import timezone
from .models import ShopInfo
from .serializers import ShopInfoSerializer
from inventory.models import Product
from sales.models import Sale
from rates.models import Rate
from rates.serializers import RateSerializer

class ShopInfoView(generics.RetrieveUpdateAPIView):
    serializer_class = ShopInfoSerializer

    def get_object(self):
        return ShopInfo.load()

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        # فقط مدیر/سوپریوزر می‌تواند تنظیمات را ویرایش کند
        from accounts.permissions import IsManagerOrSuperUser
        return [IsManagerOrSuperUser()]

class DashboardView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        
        # انبار طلا (وزن کل)
        gold_weight = Product.objects.filter(
            material='gold', is_returned=False
        ).aggregate(
            total=Coalesce(Sum(F('weight') * F('quantity')), 0.0)
        )['total']

        # انبار نقره (وزن کل)
        silver_weight = Product.objects.filter(
            material='silver', is_returned=False
        ).aggregate(
            total=Coalesce(Sum(F('weight') * F('quantity')), 0.0)
        )['total']

        # انبار جواهر (ارزش کل)
        jewelry_value = Product.objects.filter(
            material='jewelry', is_returned=False
        ).aggregate(
            total=Coalesce(Sum(F('price') * F('quantity')), 0.0)
        )['total']

        # فروش امروز
        today_amount = Sale.objects.filter(created_at__date=today).aggregate(
            total_amount=Coalesce(Sum('total_amount'), 0.0)
        )['total_amount']
        today_count = Sale.objects.filter(created_at__date=today).count()

        # نرخ‌های فعلی
        rates = Rate.objects.all().order_by('-updated_at')
        rates_serializer = RateSerializer(rates, many=True)

        # اقلام با موجودی کم یا زیر حداقل موجودی
        low_stock_qs = Product.objects.filter(
            is_returned=False,
            quantity__lte=F('min_quantity')
        ).values('id', 'code', 'name', 'material', 'quantity', 'min_quantity', 'weight')[:10]

        return Response({
            'inventory': {
                'gold': float(gold_weight),
                'silver': float(silver_weight),
                'jewelry': float(jewelry_value),
            },
            'today_sales': {
                'amount': float(today_amount),
                'count': today_count
            },
            'rates': rates_serializer.data,
            'low_stock_alerts': list(low_stock_qs),
            'low_stock_count': Product.objects.filter(is_returned=False, quantity__lte=F('min_quantity')).count()
        })
