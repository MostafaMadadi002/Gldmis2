# سیستم مدیریت زرگری "خزانه" (Khazana)

این پروژه یک سیستم جامع مدیریت طلافروشی و زرگری است که شامل بخش‌های مدیریت انبار، فروش (POS)، نرخ‌های لحظه‌ای و گزارشات هوشمند می‌باشد.

## ساختار پروژه
- **Frontend**: پیاده‌سازی شده با React + Vite + Tailwind CSS (در پوشه `src`)
- **Backend**: پیاده‌سازی شده با Django + Django Rest Framework (در پوشه `backend_django`)

---

## ۱. راه‌اندازی بخش فرانت‌اَند (Frontend)
برای اجرای محیط توسعه فرانت‌اَند:
```bash
npm install
npm run dev
```

## ۲. راه‌اندازی بخش بک‌اَند (Backend - Django)
به پوشه بک‌اَند رفته و مراحل زیر را انجام دهید:
```bash
cd backend_django
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

---

## ۳. نحوه اتصال فرانت‌اَند به بک‌اَند
در حال حاضر فرانت‌اَند از **Mock Data** و **LocalStorage** برای ذخیره‌سازی استفاده می‌کند. برای اتصال به بک‌اَند جنگو، مراحل زیر را دنبال کنید:

### گام اول: تعریف Base URL
یک فایل `.env` در ریشه پروژه بسازید و آدرس سرور جنگو را در آن قرار دهید:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### گام دوم: جایگزینی سرویس‌ها
در فایل‌هایی مانند `src/context/InventoryContext.tsx` کدهای مربوط به `localStorage` را با فراخوانی‌های API جایگزین کنید.
مثال برای دریافت محصولات:
```typescript
// قبل (LocalStorage)
const savedProducts = localStorage.getItem('khazana_inventory');

// بعد (API)
const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/inventory/products/`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
setProducts(data);
```

### گام سوم: احراز هویت (Authentication)
از اندپوینت `/api/auth/login/` برای دریافت توکن JWT استفاده کنید و آن را در استیت یا کوکی ذخیره کنید تا در درخواست‌های بعدی به هدر `Authorization` اضافه شود.

---

## ۴. نحوه تست سیستم

### تست فرانت‌اَند:
1. اجرای `npm run dev` و باز کردن آدرس لوکال.
2. ورود به سیستم با یوزرنیم و پسورد پیش‌فرض (در `mockData.ts` تعریف شده).
3. تست عملیات CRUD (افزودن کالا، ویرایش، حذف).
4. تست فرآیند فروش در صفحه POS و کسر خودکار از موجودی انبار.

### تست بک‌اَند (Django):
1. **API Testing**: استفاده از ابزارهایی مثل **Postman** یا **Insomnia** برای تست اندپوینت‌های لیست شده در `backend_django/README.md`.
2. **Django Admin**: ورود به آدرس `/admin` با سوپریوزری که ساختید برای مدیریت مستقیم دیتابیس.
3. **Unit Tests**: اجرای دستور زیر برای اجرای تست‌های نوشته شده در جنگو:
   ```bash
   python manage.py test
   ```

---

## تکنولوژی‌های استفاده شده:
- **UI/UX**: Tailwind CSS, Lucide Icons, Framer Motion
- **State Management**: React Context API
- **Backend Framework**: Django 4.x, DRF
- **Database**: SQLite (قابل تغییر به PostgreSQL برای محیط Production)
