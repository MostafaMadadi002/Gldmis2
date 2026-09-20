from django.db import models
from django.conf import settings
from inventory.models import Product

class Sale(models.Model):
    invoice_number = models.CharField(max_length=50, unique=True, editable=False)
    customer_name = models.CharField(max_length=200, blank=True)
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name="sales"
    )
    total_amount = models.DecimalField(max_digits=16, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "فروش"
        verbose_name_plural = "فروش‌ها"
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            import time
            self.invoice_number = f"INV-{int(time.time())}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.invoice_number

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(
        Product, 
        null=True, 
        on_delete=models.SET_NULL, 
        related_name="sale_items"
    )
    
    # Snapshots
    name_snapshot = models.CharField(max_length=255)
    code_snapshot = models.CharField(max_length=50, blank=True)
    material_snapshot = models.CharField(max_length=10, blank=True)
    carat_snapshot = models.CharField(max_length=50, blank=True, null=True)
    stone_snapshot = models.CharField(max_length=100, blank=True, null=True)
    
    weight = models.DecimalField(max_digits=10, decimal_places=3)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=14, decimal_places=2)
    rate_at_sale = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    purchase_price_snapshot = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, default=0, verbose_name="قیمت خرید ثبتی")

    def __str__(self):
        return f"{self.name_snapshot} in {self.sale.invoice_number}"


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('rent', 'کرایه دکان/مغازه'),
        ('salary', 'معاش و حقوق کارمندان'),
        ('utility', 'مصارف جاری و انرژی'),
        ('withdrawal', 'برداشت شخصی'),
        ('other', 'سایر مصارف'),
    ]
    title = models.CharField(max_length=255, verbose_name="عنوان مصرف یا برداشت")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other', verbose_name="دسته‌بندی")
    amount = models.DecimalField(max_digits=14, decimal_places=2, verbose_name="مبلغ (افغانی)")
    recipient = models.CharField(max_length=255, blank=True, verbose_name="دریافت‌کننده یا مسئول برداشت")
    description = models.TextField(blank=True, verbose_name="توضیحات")
    date = models.DateField(verbose_name="تاریخ")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses",
        verbose_name="ثبت‌کننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "مصرف / برداشت"
        verbose_name_plural = "مصارف و برداشت‌ها"
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.title} - {self.amount}"
