# پروژه مدیریت زرگری "خزانه" - بک‌اَند جدید (Django + DRF)

این نسخه بازنویسی شده بک‌اَند سیستم مدیریت زرگری شماست که دقیقاً با فرانت‌اَند React تطبیق داده شده است.

## ویژگی‌های اصلی

- **احراز هویت JWT**: استفاده از `simplejwt` برای امنیت بالاتر.
- **مدیریت نقش‌ها**: تفکیک دسترسی بین مدیر (Admin) و فروشنده (Seller).
- **منطق اتمیک فروش**: جلوگیری از موجودی منفی در خرید‌های همزمان.
- **گزارشات هوشمند**: داشبورد تجمیعی و نمودار فروش ۱۰ روزه.
- **مرجوعی یکپارچه**: مدیریت کالاهای مرجوعی در مدل اصلی انبار.

## آدرس‌های API

### احراز هویت و کاربران

- `POST /api/auth/login/`: ورود و دریافت توکن.
- `POST /api/auth/refresh/`: تمدید توکن.
- `GET /api/users/me/`: اطلاعات کاربر جاری.
- `GET/POST /api/users/`: مدیریت کاربران (فقط مدیر).

### انبار

- `GET/POST /api/inventory/products/`: لیست و ثبت محصولات.
- `GET /api/inventory/products/?returned=true`: لیست کالاهای مرجوعی.
- `GET/POST /api/inventory/countries/`: مدیریت کشورهای سازنده.

### نرخ روز

- `GET/POST /api/rates/rates/`: مدیریت نرخ طلا، نقره و ارز.

### فروش (POS)

- `POST /api/sales/sales/`: ثبت فاکتور جدید (با کسر خودکار از انبار).
- `GET /api/sales/sales/today/`: فاکتورهای امروز.
- `GET /api/sales/sales/last-10-days/`: داده‌های نمودار ۱۰ روز اخیر.

### تنظیمات و داشبورد

- `GET /api/shop/dashboard/`: تمام آمارهای مورد نیاز صفحه اصلی.
- `GET/PATCH /api/shop/settings/`: مشخصات فروشگاه.

---

## راهنمای راه‌اندازی

۱. نصب پکیج‌ها: `pip install -r requirements.txt`
۲. مهاجرت دیتابیس: `python manage.py makemigrations && python manage.py migrate`
۳. ساخت سوپریوزر: `python manage.py createsuperuser`
۴. اجرای سرور: `python manage.py runserver`
