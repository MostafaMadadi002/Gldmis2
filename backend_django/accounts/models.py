from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_ADMIN = 'admin'
    ROLE_SELLER = 'seller'

    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Admin/Manager'),
        (ROLE_SELLER, 'Seller'),
    ]

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default=ROLE_SELLER
    )
    
    father_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    image = models.ImageField(upload_to='avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def has_full_access(self):
        return self.is_superuser or self.role == self.ROLE_ADMIN
