# پرامپت اجرایی دقیق — فاز API فایلینگ و جداسازی مستأجر

## متن پرامپت

> با حفظ SPA فعلی، یک backend اولیه برای مدیریت فایل ملک بساز: NestJS + PostgreSQL/Drizzle، API نسخه‌دار و contract-first، ورودی strict، JWT احراز‌شده با Supabase JWKS، tenant membership معتبر در سرور، branch-scoped RBAC و RLS. tenant/branch/user را از body یا query معتبر فرض نکن؛ تنها tenant انتخابی header را پس از بررسی membership فعال قبول کن. قیمت‌ها را به‌صورت integer string/numeric و واحد ارز صریح نگه‌دار. هیچ hard-delete برای فایل نساز؛ archive/restore نسخه‌پذیر با audit باشد. migration فقط additive، checksum-protected و RLS-enforced باشد؛ role runtime فاقد BYPASSRLS و حداقل دسترسی داشته باشد. ابتدا تست‌های دامنه/DTO/امنیت و قرارداد migration را بنویس، سپس implementation را سبز کن. از token شبیه‌سازی‌شده، mock endpoint، database project نامعلوم، secret در سورس و اتصال UI به `localhost` استفاده نکن. اگر DB واقعی برای ملکینو مشخص نیست، کد و migration را آماده کن ولی اعمال نکن و صریح گزارش بده.

## مهارت‌های انتخاب‌شده از `rahmaniho/Agent`
- `kit/skills/api-design`: resource-oriented `/api/v1/properties`, status codes, validation و pagination.
- `kit/skills/backend-patterns`: controller/service/database boundary، query scopes و خطاهای کنترل‌شده.
- `kit/skills/postgres-patterns`: `numeric`, زمان‌دارهای `timestamptz`, ایندکس‌های tenant-aware و RLS.
- `kit/skills/database-migrations`: migration افزودنی، checksum، ترتیب اجرا و عدم حذف.
- `kit/skills/security-review`: اعتبارسنجی، secrets خارج سورس، JWT، tenant isolation و عدم اعتماد به ورودی.
- `kit/skills/tdd-workflow`: تست‌های RED/GREEN برای قوانین مالی، دسترسی، DTO و schema safety.

مهارت Google Maps scraper از مخزن `rahmaniho/Skill` برای این API لازم نیست؛ داده‌ی لید کسب‌وکار از املاک مشتریان جداست و scraper به این مرحله اضافه نشده است.
