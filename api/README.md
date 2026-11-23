# Melkino API — فاز پایهٔ فایلینگ

Backend مرحله‌ای برای فایلینگ و CRM مشتریان، با NestJS + Drizzle + PostgreSQL؛ این کد هنوز به دیتابیس ملکینو وصل یا در production اجرا نشده است.

## اجرا
1. از یک پروژهٔ PostgreSQL **اختصاصی ملکینو** و Supabase Auth اختصاصی استفاده کنید. این مخزن هیچ پروژهٔ ابری را انتخاب یا تغییر نمی‌دهد.
2. `.env.example` را به `.env` کپی و `DATABASE_URL`, `MIGRATION_DATABASE_URL`, `SUPABASE_URL` را تنظیم کنید. مقادیر واقعی را commit نکنید.
3. نقش migrator باید مجاز به اعمال DDL/ساخت نقش محدود `melkino_runtime` باشد. ابتدا migration را بازبینی کنید، سپس `npm run db:migrate` را اجرا کنید.
4. یک Login role کم‌دسترسی بسازید و DBA آن را به `melkino_runtime` عضو کند؛ API فقط داخل تراکنش با `SET LOCAL ROLE melkino_runtime` کار می‌کند. از `postgres`, superuser یا `service_role` برای API استفاده نکنید.
5. عضویت آژانس/شعبه را فقط از فرایند مدیریتی تأییدشده ایجاد کنید؛ endpoint عمومی برای ساخت tenant یا ارتقای نقش وجود ندارد.
6. `npm run api:dev` را اجرا کنید. Frontend از مسیر نسبی `/api` و proxy توسعه استفاده می‌کند.

در این workspace نه PostgreSQL/Docker محلی نصب است و نه یک پروژهٔ ابری به‌عنوان محیط ملکینو تعیین شده؛ بنابراین مهاجرت‌ها روی دیتابیس ملکینو عمداً **اجرا نشده‌اند** و API را بدون متغیرهای محیطی معتبر نباید اجرا کرد. Runner همه فایل‌های شماره‌دار را به ترتیب اعمال می‌کند و checksum مهاجرت اجراشده را کنترل می‌کند.

## Authentication و tenant context
- `Authorization: Bearer <Supabase access token>` توسط JWKS نامتقارن و audience/issuer بررسی می‌شود؛ HMAC/legacy JWT عمداً پذیرفته نمی‌شود.
- هر درخواست فایلینگ باید `X-Tenant-Id` داشته باشد. مقدار آن فقط «انتخاب مستأجر» است: API عضویت فعال همان `sub` را در DB می‌خواند و نقش/شعبه را از membership می‌گیرد؛ tenant ID بدنه یا token دلخواه کاربر معتبر تلقی نمی‌شود.
- هر query داده‌ای داخل تراکنش tenant-scoped اجرا می‌شود و `app.user_id`/`app.tenant_id` با `SET LOCAL` تنظیم می‌شوند. RLS، FORCE RLS و نقش `NOBYPASSRLS` دفاع دوم‌اند.
- نقش‌های غیرمالک باید membership محدود به شعبه داشته باشند. عامل فقط فایل‌ها و مشتریان تخصیص‌یافته به خودش را می‌بیند/ویرایش می‌کند؛ حسابدار از CRM مشتریان منع شده است و حذف سخت برای این موجودیت‌ها endpoint ندارد.

## API v1
- `GET /api/v1/health`
- `GET /api/v1/properties?limit=30&offset=0&status=ACTIVE&includeArchived=false`
- `GET /api/v1/properties/:uuid`
- `POST /api/v1/properties`
- `PATCH /api/v1/properties/:uuid`
- `POST /api/v1/properties/:uuid/archive`
- `POST /api/v1/properties/:uuid/restore`
- `GET /api/v1/customers?limit=30&offset=0&status=NEW&includeArchived=false&search=...`
- `GET /api/v1/customers/:uuid`
- `POST /api/v1/customers`
- `PATCH /api/v1/customers/:uuid`
- `POST /api/v1/customers/:uuid/archive`
- `POST /api/v1/customers/:uuid/restore`
- `GET /api/v1/follow-ups?limit=50&offset=0&status=OPEN`
- `POST /api/v1/follow-ups`
- `POST /api/v1/follow-ups/:uuid/complete`
- `POST /api/v1/follow-ups/:uuid/cancel`

پیگیری‌ها به مشتری و به‌صورت اختیاری به فایل ملک متصل‌اند؛ انواع `CALL`, `MEETING`, `PROPERTY_VISIT`, `REMINDER` و وضعیت‌های `OPEN`, `DONE`, `CANCELLED` پشتیبانی می‌شوند. ثبت/فهرست/تکمیل/لغو از API انجام می‌شود؛ نقش‌های مجاز و RLS محدودیت tenant/branch/assignment را enforce می‌کنند. عملیات در `follow_up_audit_log` ثبت می‌شوند. UI فعلی جدول فهرست و فرم ثبت دارد، اما اعلان و یادآوری خودکار یا تقویم کامل را ارائه نمی‌کند.

CRM اطلاعات تماس و نیاز مشتری را با واحد پول و بودجهٔ صحیح ذخیره می‌کند؛ سرنخ‌ها برای اعضای مجاز branch-scoped هستند، مشاور فقط مخاطبان تخصیص‌یافته را می‌بیند و حسابدار به CRM دسترسی ندارد. تغییرهای مشتریان در `customer_audit_log` ثبت می‌شوند.

واحد پول سند صریح است (`IRR` یا `IRT`) و مقادیر مالی به‌صورت رشتهٔ عدد صحیح به ستون `numeric(20,0)` می‌روند، نه `float`. برای رهن و اجاره اعتبارسنجی مبلغ‌ها و مراحل وضعیت وجود دارد. قیمت‌گذاری پیشنهادی/قانونی کمیسیون در این ماژول انجام نمی‌شود.

## محدودیت‌های این مرحله
- مهاجرت‌های `0001` تا `0003` در PGlite (PostgreSQL WASM) اجرا شده‌اند و ۱۳ سناریوی RLS/tenant/branch/audit برای فایل، CRM و پیگیری سبز هستند؛ مهاجرت‌ها هنوز روی PostgreSQL/Supabase واقعی اجرا نشده‌اند و آزمون رسمی آن محیط لازم است.
- رابط در صورت پیکربندی `VITE_*` به Supabase Auth و API وصل می‌شود؛ ورود و عملیات فایلینگ فقط از API انجام می‌شوند و دادهٔ نمونه/localStorage مسیر اجرایی ندارد. بدون پیکربندی معتبر، رابط صفحهٔ راه‌اندازی نشان می‌دهد.
- provisioning کاربر/عضویت، reset password، storage رسانه، تغییر نقش و مدیریت branch هنوز پیاده‌سازی نشده‌اند.
- قبل از استفاده واقعی: اجرای migration در محیط اختصاصی، آزمون PostgreSQL/RLS با چند tenant/role، مدیریت عضویت و تست integration/E2E الزامی است.
