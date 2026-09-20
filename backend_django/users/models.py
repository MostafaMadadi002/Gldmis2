from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # تعریف نقش‌ها
    ROLE_SUPERUSER = 'SUPERUSER'
    ROLE_MANAGER = 'MANAGER'
    ROLE_SELLER = 'SELLER'

    ROLE_CHOICES = [
        (ROLE_SUPERUSER, 'Super User (Developer)'),
        (ROLE_MANAGER, 'Manager (Shop Owner)'),
        (ROLE_SELLER, 'Seller'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_SELLER
    )
    
    phone = models.CharField(max_length=15, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    def __str__(self):
        return f"{self.username} - {self.get_role_display()}"

    # متدهای کمکی برای چک کردن دسترسی در کدها
    @property
    def is_manager(self):
        return self.role in [self.ROLE_MANAGER, self.ROLE_SUPERUSER]

    @property
    def is_seller_only(self):
        return self.role == self.ROLE_SELLER
