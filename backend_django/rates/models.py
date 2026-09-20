from django.db import models
from django.conf import settings

class Rate(models.Model):
    TYPE_CHOICES = [
        ('gold', 'طلا'),
        ('silver', 'نقره'),
        ('currency', 'ارز'),
        ('gemstone', 'سنگ قیمتی'),
    ]

    type = models.CharField(max_length=15, choices=TYPE_CHOICES, verbose_name="نوع")
    label = models.CharField(max_length=100, verbose_name="عنوان")
    value = models.DecimalField(max_digits=14, decimal_places=2, verbose_name="مقدار/فی")
    currency = models.CharField(max_length=20, default="افغانی", verbose_name="واحد پول")
    
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        null=True, 
        on_delete=models.SET_NULL,
        verbose_name="توسط"
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین بروزرسانی")

    class Meta:
        verbose_name = "نرخ روز"
        verbose_name_plural = "نرخ‌های روز"

    def __str__(self):
        return f"{self.label}: {self.value} {self.currency}"
