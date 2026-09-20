from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum
from django.db.models.functions import Coalesce
from .models import Sale, Expense
from .serializers import SaleSerializer, ExpenseSerializer

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Sale.objects.all().order_by('-created_at')

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.localdate()
        sales = self.get_queryset().filter(created_at__date=today)
        serializer = self.get_serializer(sales, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='last-10-days')
    def last_10_days(self, request):
        today = timezone.localdate()
        data = []
        for i in range(9, -1, -1):
            day = today - timezone.timedelta(days=i)
            amount = Sale.objects.filter(created_at__date=day).aggregate(
                total=Coalesce(Sum("total_amount"), 0)
            )["total"]
            data.append({
                "date": day.isoformat(), 
                "amount": float(amount)
            })
        return Response(data)

    def destroy(self, request, *args, **kwargs):
        # فقط مدیر/سوپریوزر می‌تواند حذف کند
        if not (request.user.is_superuser or request.user.role == 'admin'):
            return Response(
                {"detail": "فقط مدیران می‌توانند فاکتور را حذف کنند."},
                status=403
            )
        return super().destroy(request, *args, **kwargs)


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.all().order_by('-date', '-created_at')

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.localdate()
        expenses = self.get_queryset().filter(date=today)
        serializer = self.get_serializer(expenses, many=True)
        return Response(serializer.data)

