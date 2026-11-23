# معماری سیستم — پیشنهاد مرحله‌ای

## وضعیت موجود
رابط React/TypeScript/Vite اکنون در صورت پیکربندی محیط از Supabase Auth نشست می‌گیرد و عملیات فایلینگ را از طریق API NestJS/Drizzle/PostgreSQL انجام می‌دهد؛ دادهٔ نمونه و localStorage از مسیر اجرا حذف شده‌اند. API شامل JWT/JWKS، membership guard، PostgreSQL migration و RLS است. این workspace هنوز به DB/Auth واقعی وصل نیست، پس UI بدون env معتبر صفحهٔ راه‌اندازی می‌دهد و migration فقط در PGlite آزموده شده است. هدف میزبانی رابط و API، cPanel است؛ الزامات در `docs/CPANEL_DEPLOYMENT.md` ثبت شده.

## معماری هدف مطابق نیازمندی‌ها
- Frontend: React + TypeScript + Vite، رابط RTL و API client صریح.
- Backend: NestJS modular monolith با REST و OpenAPI.
- پایگاه داده: PostgreSQL با migration نسخه‌بندی‌شده؛ ORM پس از ارزیابی انتخاب شود.
- مرزهای دامنه: Identity/Tenant، Property، CRM/Matching، Transaction/Contract، Finance/Commission، Operations، Documents/Integrations.
- فایل: S3-compatible، کلیدهای namespaced برای tenant و دانلود با URL امضاشده.
- پردازش پس‌زمینه: Queue و Worker فقط پس از تعریف نیازمندی عملیاتی.
- مشاهده‌پذیری: structured logs، metrics، audit trail و alerting.

## مرزهای امنیتی
Tenant context باید از نشست احراز‌شده تعیین شود، نه از ورودی ارسالی کاربر. کنترل دسترسی در Backend و در هر درخواست اعمال شود؛ UI صرفاً نمایش را کنترل می‌کند. اعمال RLS، مدیریت اسرار و سیاست backup نیازمند پیاده‌سازی و آزمون واقعی است.

## نقشه مهاجرت
۱) انتخاب محیط واقعی PostgreSQL و Supabase Auth، اجرای کنترل‌شده migration و E2E فایلینگ، ۲) تکمیل اتصال و آزمون استقرار cPanel، ۳) ماژول CRM و Matching، ۴) معاملات/اسناد و سپس مالی، ۵) تست امنیتی و انتشار مرحله‌ای. هیچ دیتابیس تولیدی تغییر نکرده است.
