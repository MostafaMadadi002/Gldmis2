from django.db import models
from django.conf import settings

class Country(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="نام کشور")

    class Meta:
        verbose_name = "کشور"
        verbose_name_plural = "کشورها"

    def __str__(self):
        return self.name

class Product(models.Model):
    MATERIAL_CHOICES = [
        ('gold', 'طلا'),
        ('silver', 'نقره'),
        ('jewelry', 'جواهر'),
    ]

    code = models.CharField(max_length=50, unique=True, verbose_name="کد کالا")
    name = models.CharField(max_length=200, verbose_name="نام کالا")
    weight = models.DecimalField(max_digits=10, decimal_places=3, verbose_name="وزن (گرم)")
    material = models.CharField(max_length=10, choices=MATERIAL_CHOICES, verbose_name="جنس کالا")
    carat = models.CharField(max_length=50, blank=True, null=True, verbose_name="عیار")
    stone_type = models.CharField(max_length=100, blank=True, null=True, verbose_name="نوع سنگ")
    
    country = models.ForeignKey(Country, on_delete=models.PROTECT, verbose_name="کشور سازنده")
    
    quantity = models.PositiveIntegerField(default=0, verbose_name="تعداد/موجودی")
    min_quantity = models.PositiveIntegerField(default=1, verbose_name="حداقل موجودی (هشدار)")
    price = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True, verbose_name="قیمت")
    
    image = models.ImageField(upload_to='products/', blank=True, null=True, verbose_name="تصویر محصول")
    is_returned = models.BooleanField(default=False, verbose_name="مرجوعی")
    second_hand_destination = models.CharField(
        max_length=20,
        choices=[('inventory', 'انبار فروش'), ('melt', 'ذوب')],
        blank=True,
        null=True,
        verbose_name="مقصد خرید دست دوم"
    )
    purchase_price = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True, verbose_name="قیمت خرید")
    deduct_from_melt = models.BooleanField(default=False, verbose_name="کسر از موجودی ذوب")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="ویرایش توسط")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "محصول"
        verbose_name_plural = "محصولات"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.code})"
