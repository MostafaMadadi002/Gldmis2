from django.db import models

class ShopInfo(models.Model):
    name = models.CharField(max_length=255, default="جواهرات خزانه")
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    logo = models.ImageField(upload_to='shop/', blank=True, null=True)
    language = models.CharField(
        max_length=10, 
        choices=[('fa','فارسی'), ('en','English')], 
        default='fa'
    )
    theme = models.CharField(
        max_length=10, 
        choices=[('light','روشن'), ('dark','تاریک')], 
        default='light'
    )

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    class Meta:
        verbose_name = "تنظیمات فروشگاه"
        verbose_name_plural = "تنظیمات فروشگاه"
