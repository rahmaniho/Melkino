# برنامه امنیتی ملکینو

## وضعیت فعلی
UI در صورت پیکربندی به Supabase Auth و API وصل می‌شود؛ عملیات فایلینگ به localStorage یا دادهٔ نمونه fallback نمی‌کند. این workspace هنوز credential یا endpoint واقعی ندارد؛ بنابراین اتصال end-to-end با حساب و DB تولیدی اثبات نشده است. در API، JWT/JWKS، tenant membership، branch scope، validation، rate limiting، security headers و PostgreSQL RLS پیاده‌سازی شده‌اند. استفاده از API واقعی تا انتخاب محیط، اجرای migration و تنظیم role کم‌دسترسی مجاز نیست.

## الزامات پیش از تولید
- انتخاب مدل نشست امن و پیاده‌سازی احراز هویت، محدودسازی نرخ و مدیریت نشست.
- Authorization و RBAC در Backend، همراه با آزمون privilege escalation و IDOR.
- tenant context معتبر، جداسازی tenant و آزمون‌های cross-tenant؛ در PostgreSQL، طراحی/آزمون RLS به‌عنوان لایه دفاعی.
- اعتبارسنجی ورودی سمت سرور، escaping، CSP و security headers.
- آپلود فایل با allowlist نوع/اندازه، بررسی محتوا، storage خصوصی و URL امضاشده.
- ثبت audit برای تغییر دسترسی، اطلاعات مالی، اسناد و عملیات حساس.
- مدیریت اسرار خارج از کد، رمزنگاری backup و تمرین بازیابی.
- dependency scanning، تست نفوذ و کنترل دسترسی مستمر در CI.

JWT/JWKS guard، tenant membership check، DTO validation، security headers/rate-limit و RLS policy برای فایل، CRM و پیگیری در کد آماده‌اند؛ ۱۳ سناریوی RLS/tenant/branch/audit با PGlite آزموده شده‌اند و جای PostgreSQL واقعی را نمی‌گیرند. آزمون در Supabase/PostgreSQL واقعی، provisioning/credential review و penetration test هنوز اجرا نشده‌اند. فرم فایلینگ، CRM و پیگیری‌ها از UI به API ارسال می‌شوند فقط پس از پیکربندی و ورود کاربر؛ هنوز هیچ درخواست عملی به محیط اختصاصی ملکینو انجام نشده است.
