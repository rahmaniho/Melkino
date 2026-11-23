# استقرار ملکینو روی cPanel

این راهنما برای استقرار مرحله‌ای فعلی است: رابط فارسی + API فایلینگ. انتشار واقعی انجام نشده و هیچ migration یا تنظیم cPanel اجرا نشده است.

## معماری پیشنهادی

- رابط React/Vite پس از build به‌صورت فایل ایستا در `public_html`.
- API NestJS به‌عنوان Node.js Application مستقل در cPanel و ترجیحاً روی زیردامنهٔ `api.example.com`.
- PostgreSQL با اتصال TLS؛ یا روی همان میزبان، فقط اگر سرویس و مجوزهای نقش/DDL لازم را ارائه کند، یا روی PostgreSQL اختصاصی جداگانه.
- Supabase فقط برای Auth در صورت انتخاب پروژهٔ اختصاصی ملکینو؛ URL و کلید publishable در build فرانت‌اند هستند. کلید `service_role` هرگز نباید به مرورگر یا متغیر `VITE_*` داده شود.

## پیش‌نیازهایی که باید از شرکت هاست پرسیده شوند

1. آیا cPanel گزینهٔ **Setup Node.js App / Application Manager** دارد و Node.js **20 یا جدیدتر** را ارائه می‌کند؟ NestJS 11 به Node 20+ نیاز دارد.
2. آیا برنامهٔ Node.js اجازهٔ اتصال خروجی TLS به PostgreSQL دارد؟ آیا PostgreSQL ارائه می‌شود؟
3. آیا نقش دیتابیس اجازهٔ migration و ساخت/اتصال runtime role محدود `melkino_runtime` را دارد؟ اگر نه، از PostgreSQL میزبانی‌شدهٔ جداگانه و DBA دارای مجوز استفاده شود؛ دسترسی API با superuser یا `service_role` قابل‌قبول نیست.
4. آیا برای برنامهٔ Node.js متغیرهای محیطی امن، restart، و log در دسترس است؟

## build فرانت‌اند

متغیرهای زیر در محیط build تنظیم شوند (نه با مقادیر نمونه):

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-anon-key>
VITE_TENANT_ID=<tenant-uuid>
VITE_DEFAULT_BRANCH_ID=<branch-uuid>
VITE_API_BASE_URL=https://api.example.com/api/v1
```

سپس در CI یا محیط build قابل‌اعتماد:

```bash
npm ci
npm run build
```

محتویات `dist/` به `public_html/` منتقل شود. مقدار `VITE_*` در bundle مرورگر دیده می‌شود؛ تنها URL، شناسه‌ها و کلید publishable برای فرانت‌اند مجازند، نه رمز دیتابیس، JWT secret یا Supabase service-role key.

اگر API روی همان origin با reverse proxy در مسیر `/api` تنظیم شود، `VITE_API_BASE_URL=/api/v1` باشد. فعال بودن proxy/path routing را باید از هاست تأیید کرد؛ `.htaccess` به‌تنهایی proxy را ایجاد نمی‌کند.

## API روی cPanel

- Node application root را روی مسیر اختصاصی API قرار دهید؛ startup file خروجی `api/dist/main.js` است.
- artifact برنامه باید `package.json` ریشه با `type: module`، `api/dist/` و lockfile را داشته باشد؛ وابستگی‌های production نصب شوند (`npm ci --omit=dev`).
- متغیرهای محیطی را در پنل برنامهٔ Node تنظیم کنید: `DATABASE_URL`, `SUPABASE_URL`, `DB_POOL_MAX`, `FRONTEND_ORIGINS`. پورت را طبق پورت تخصیص‌یافتهٔ cPanel به `API_PORT` بدهید؛ برنامه متغیر استاندارد `PORT` را هم می‌خواند. اسرار را داخل مخزن یا `public_html` نگذارید.
- در صورت استفاده از زیردامنه API، `FRONTEND_ORIGINS` باید دقیقاً origin HTTPS فرانت‌اند باشد؛ برای مثال `https://melkino.example.com`، بدون مسیر و slash پایانی.
- بررسی سلامت: `GET https://api.example.com/api/v1/health` باید پس از تنظیم اتصال DB پاسخ سالم بدهد.

## دیتابیس و انتشار

مهاجرت‌های `0001` و `0002` در PGlite آزموده شده‌اند، نه روی دیتابیس واقعی. پیش از هر اجرای production: انتخاب و تأیید صریح دیتابیس اختصاصی، backup، بازبینی SQL با DBA، اجرای migration با نقش migrator جدا، provisioning نقش runtime کم‌دسترسی، و آزمون RLS روی PostgreSQL واقعی الزامی است. migration را از صفحهٔ وب یا startup خودکار اجرا نکنید.

ورود کاربران از Supabase Auth پشتیبانی می‌شود؛ حساب‌ها و عضویت آژانس باید از فرایند مدیریتی معتبر provision شوند. انتخاب پروژهٔ Supabase و درج credential تا تأیید صریح محیط ملکینو انجام نمی‌شود.
