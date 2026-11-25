# ملکینو — سامانه مدیریت املاک

ملکینو در نسخهٔ محلیِ قابل استفاده، فایل‌های ملک، مشتریان، پیگیری‌ها، معاملات و کمیسیون‌ها را در `localStorage` و اسناد را در `IndexedDB` همان مرورگر نگه می‌دارد؛ گزارش‌ها از همین اطلاعات ثبت‌شده محاسبه می‌شوند و دادهٔ نمونه‌ای نمایش داده نمی‌شود. این حالت برای کار روی همان مرورگر/دستگاه است: حساب کاربری، همگام‌سازی میان دستگاه‌ها و پشتیبان ابری ندارد؛ پاک‌شدن داده‌های مرورگر یا خرابی دستگاه ممکن است اطلاعات را از بین ببرد. ذخیره‌سازی رمزنگاری ویژه ندارد و برای اسناد بسیار حساس، اطلاعات مالی محرمانه یا حسابداری رسمی مناسب نیست. رابط API/Auth نیز در معماری وجود دارد، اما تا وقتی زیرساخت اختصاصی ملکینو جداگانه تنظیم و آزموده نشده، این نسخه به آن وصل نیست.

برای اجرای محلی با حالت ذخیره‌سازی مرورگر: `VITE_LOCAL_MODE=true npm run dev`؛ برای ساخت: `VITE_LOCAL_MODE=true npm run build`.

- راهنمای استقرار روی cPanel: [`docs/CPANEL_DEPLOYMENT.md`](docs/CPANEL_DEPLOYMENT.md)
- راهنمای API و محدودیت‌های محیط: [`api/README.md`](api/README.md)
- تنظیمات لازم در نمونه: [`.env.example`](.env.example)
- پیش از production هنوز باید Supabase و دیتابیس اختصاصی ملکینو صریحاً انتخاب و پیکربندی شوند؛ migration روی دیتابیس واقعی اجرا نشده است.

```bash
npm ci
npm test
npm run build:all
```

---

MASTER EXECUTION PROMPT

ENTERPRISE REAL ESTATE MANAGEMENT PLATFORM

KarenSoft | Real Estate OS

تو در نقش یک تیم کامل مهندسی نرم‌افزار Enterprise فعالیت می‌کنی که شامل این تخصص‌هاست:

- Principal Software Architect
- Senior Full-Stack Engineer
- Backend Engineer
- Frontend Engineer
- Database Architect
- UI/UX Designer
- Product Designer
- Security Engineer
- QA Automation Engineer
- DevOps Engineer
- AI Integration Engineer

ماموریت تو طراحی، توسعه، تست و آماده‌سازی یک پلتفرم جامع مدیریت آژانس‌های مشاور املاک در سطح Enterprise است.

این پروژه نباید به یک نرم‌افزار ساده فایلینگ تبدیل شود. هدف، ساخت یک سیستم عملیاتی یکپارچه برای مدیریت کامل کسب‌وکار آژانس املاک است.

---

1. PRODUCT IDENTITY

نام کاری محصول:

Real Estate OS

Product Owner:
KarenSoft

Product Category:
Enterprise Real Estate Agency Management Platform

Target Market:
Iranian Real Estate Agencies

Business Model:
Hybrid SaaS + Dedicated Enterprise Deployment

Product Level:
Enterprise

Design Direction:
Minimal Premium

Primary Language:
Persian

Interface Direction:
RTL First

Currency:
IRR / IRT (ریال و تومان با تفکیک دقیق)

Calendar:
Jalali First

Primary Users:

- Agency Owner
- Super Admin
- Branch Manager
- Sales Manager
- Real Estate Agent
- Accountant
- Receptionist
- Customer
- Property Owner

ماموریت محصول:
تمام عملیات آژانس املاک از ثبت فایل اولیه تا جذب مشتری، بازدید، مذاکره، قرارداد، دریافت کمیسیون و گزارش مدیریتی باید در یک سیستم یکپارچه انجام شود.

2. CRITICAL EXECUTION RULES

قوانین غیرقابل مذاکره:

1. ابتدا مخزن و کد موجود را بررسی کن.
2. قبل از شناخت معماری فعلی هیچ بازنویسی گسترده‌ای انجام نده.
3. قابلیت‌های سالم موجود را حفظ کن.
4. از داده‌های موجود محافظت کن.
5. هیچ اطلاعاتی را بدون تأیید و برنامه مهاجرت حذف نکن.
6. قابلیت‌های نمایشی و Mock را به‌عنوان قابلیت واقعی معرفی نکن.
7. تمام دکمه‌ها، فرم‌ها و منوها باید عملکرد واقعی داشته باشند.
8. هیچ اطلاعات آزمایشی در محیط Production باقی نگذار.
9. هیچ قابلیت امنیتی صرفاً در Frontend پیاده‌سازی نشود.
10. تمام عملیات حساس باید در Backend اعتبارسنجی شوند.
11. قبل از هر Migration از سازگاری و امکان بازگشت اطمینان حاصل کن.
12. تست‌ها را در هر مرحله اجرا کن.
13. خطاها را پنهان نکن.
14. برای سرویس‌های خارجی که API یا دسترسی واقعی ندارند، Adapter و وضعیت اتصال شفاف ایجاد کن؛ هرگز اتصال جعلی نساز.
15. در پایان هر مرحله گزارش واقعی پیشرفت ارائه بده.

3. PHASE ZERO — TECHNICAL AUDIT

قبل از توسعه:

- ساختار کامل Repository را بررسی کن.
- Frameworkها و نسخه‌ها را شناسایی کن.
- Backend و Frontend موجود را مشخص کن.
- Database و Schema را بررسی کن.
- وضعیت Authentication را بررسی کن.
- وضعیت Authorization را بررسی کن.
- صفحات و قابلیت‌های موجود را استخراج کن.
- APIهای موجود را مستند کن.
- وابستگی‌های پروژه را بررسی کن.
- وضعیت Responsive و RTL را بررسی کن.
- نقاط ضعف امنیتی را شناسایی کن.
- مشکلات عملکردی را شناسایی کن.
- تست‌های موجود و پوشش آن‌ها را بررسی کن.

خروجی اجباری:

docs/TECHNICAL_AUDIT.md
docs/PRODUCT_REQUIREMENTS.md
docs/SYSTEM_ARCHITECTURE.md
docs/DATABASE_DESIGN.md
docs/IMPLEMENTATION_ROADMAP.md
docs/SECURITY_PLAN.md

پس از Audit، یک برنامه اجرایی بر اساس وضعیت واقعی پروژه تهیه کن.

اگر معماری فعلی مناسب است، آن را ارتقا بده؛ اگر نامناسب است، مهاجرت مرحله‌ای پیشنهاد کن.

4. TARGET ARCHITECTURE

معماری هدف:

Modular Monolith

Frontend:
React + TypeScript + Vite

Backend:
NestJS + TypeScript

Database:
PostgreSQL

ORM:
Prisma یا Drizzle، بر اساس ارزیابی فنی

Cache:
Redis

Background Processing:
Queue-based Workers

Storage:
S3-compatible Object Storage

API:
REST + OpenAPI

Testing:
Vitest + Playwright + Integration Testing

Deployment:
Docker + CI/CD

معماری باید قابلیت توسعه مستقل ماژول‌ها و جداسازی سرویس‌ها در آینده را داشته باشد.

ماژول‌ها نباید مستقیماً به دیتابیس یا منطق داخلی یکدیگر دسترسی نامحدود داشته باشند.

برای ارتباط بین ماژول‌ها از Application Services و Domain Events استفاده کن.

5. MULTI-TENANT ENTERPRISE ARCHITECTURE

سیستم باید چندمستاجری واقعی باشد.

دو نوع استقرار:

A. SaaS:
چندین آژانس روی زیرساخت مشترک با جداسازی کامل اطلاعات.

B. Dedicated:
زیرساخت، پایگاه داده و فضای ذخیره‌سازی اختصاصی برای مشتری Enterprise.

الزامات:

- tenant_id برای موجودیت‌های سازمانی
- Tenant Context Middleware
- Tenant-aware Authorization
- PostgreSQL Row Level Security
- جلوگیری از Cross-Tenant Data Access
- جداسازی فایل‌های هر Tenant
- تنظیمات اختصاصی هر آژانس
- محدودیت کاربران بر اساس اشتراک
- مدیریت چند شعبه
- گزارش‌گیری سازمانی
- Export و Import امن اطلاعات
- پشتیبان‌گیری و بازیابی مستقل
- ثبت رویدادهای امنیتی

Tenant ID هرگز نباید صرفاً از ورودی قابل اعتماد کاربر پذیرفته شود؛ باید از Context احراز هویت‌شده استخراج و اعتبارسنجی شود.

6. CORE BUSINESS MODULES

MODULE 01 — PROPERTY MANAGEMENT

ساخت سیستم جامع فایلینگ املاک.

امکانات:

- ثبت ملک
- ویرایش ملک
- آرشیو
- دسته‌بندی
- مدیریت تصاویر و ویدئوها
- موقعیت روی نقشه
- اطلاعات مالک
- مشخصات فنی ملک
- امکانات ساختمان
- وضعیت سند
- قیمت فروش
- مبلغ رهن
- مبلغ اجاره
- قیمت هر متر
- قیمت پیشنهادی و قابل مذاکره
- تاریخ ورود فایل
- تاریخ اعتبار فایل
- مشاور مسئول
- تاریخچه قیمت
- تاریخچه تغییرات
- تاریخچه بازدید
- ثبت ملک تکراری
- کد اختصاصی فایل
- QR Code
- جستجوی پیشرفته
- فیلترهای ترکیبی
- ذخیره جستجو
- خروجی PDF و Excel

انواع ملک قابل تنظیم باشند.

اطلاعات هر ملک باید ساختارمند باشد و دسته‌بندی امکانات قابلیت توسعه داشته باشد.

فایل منقضی‌شده نباید بدون بررسی مجدد به‌عنوان فایل فعال معرفی شود.

MODULE 02 — CRM

مدیریت جامع مشتریان و ارتباطات.

انواع اشخاص:

- خریدار
- فروشنده
- مستأجر
- موجر
- مالک
- سرمایه‌گذار
- معرف

امکانات:

- پروفایل اشخاص
- شماره‌های تماس
- سوابق ارتباطی
- درخواست خرید
- درخواست فروش
- درخواست رهن
- درخواست اجاره
- محدوده بودجه
- محدوده جغرافیایی
- متراژ
- تعداد اتاق
- امکانات
- یادداشت
- وظیفه پیگیری
- یادآوری
- سوابق بازدید
- سوابق پیشنهاد ملک
- تاریخچه تغییر مسئول پرونده

امکان تعریف قیف فروش قابل تنظیم.

MODULE 03 — SMART MATCHING ENGINE

یک موتور تطبیق واقعی بساز.

ورودی:
نیازهای مشتری.

خروجی:
لیست املاک متناسب با درخواست.

معیارها:

- بودجه
- محله
- موقعیت
- متراژ
- نوع ملک
- تعداد اتاق
- امکانات
- نوع معامله
- وضعیت فایل

امکانات:

- امتیاز تطبیق
- توضیح علت تطبیق
- نمایش معیارهای منطبق و نامنطبق
- رتبه‌بندی نتایج
- اعلان فایل جدید مناسب مشتری
- پیشنهاد به مشاور
- امکان تأیید ارسال پیشنهاد به مشتری

وزن معیارها قابل تنظیم باشد.

هیچ پیشنهاد خودکاری نباید بدون مجوز و تنظیمات ارتباطی مشتری ارسال شود.

MODULE 04 — TRANSACTION MANAGEMENT

مدیریت پرونده معاملات.

انواع معامله:

- خرید و فروش
- رهن و اجاره
- تمدید
- معاوضه
- سایر انواع قابل تعریف

امکانات:

- پرونده معامله
- ارتباط با فایل
- ارتباط با مشتریان
- طرفین معامله
- مشاور مسئول
- شعبه مربوطه
- مراحل مذاکره
- مبلغ توافق
- شرایط مالی
- پیش‌پرداخت
- اقساط
- وضعیت معامله
- تاریخچه تغییرات
- مدارک
- فعالیت‌ها
- گزارش نهایی

از انتقال غیرمجاز یا تغییر بی‌ردپای وضعیت معامله جلوگیری کن.

MODULE 05 — CONTRACT MANAGEMENT

- قالب قرارداد
- پیش‌نویس
- اطلاعات طرفین
- اطلاعات ملک
- شروط اختصاصی
- پیوست
- نسخه‌بندی
- تاریخچه اصلاحات
- الحاقیه
- تمدید
- فسخ
- چاپ فارسی
- PDF
- بایگانی
- دسترسی محدود

موتور اسناد فارسی باید از RTL، اعداد فارسی، فونت مناسب، صفحه‌بندی، سربرگ، امضا و چاپ استاندارد پشتیبانی کند.

امضای الکترونیکی فقط با اتصال واقعی به سرویس معتبر و مجاز ارائه شود.

7. FINANCIAL ENGINE

یک موتور مالی مستقل و قابل توسعه ایجاد کن.

قابلیت‌ها:

- حساب‌ها
- صندوق‌ها
- حساب بانکی
- دریافت
- پرداخت
- بدهی
- طلب
- هزینه
- درآمد
- فاکتور
- اسناد مالی
- گزارش گردش حساب
- گزارش درآمد
- گزارش هزینه
- سود و زیان
- گزارش تسویه

از Decimal برای تمام مقادیر پولی استفاده کن.

واحد پول هر سند صریح باشد.

تبدیل ریال و تومان فقط در لایه مشخص و با قوانین واحد پول انجام شود.

در صورت پیاده‌سازی حسابداری دوطرفه، تراز بودن اسناد الزامی است.

اسناد نهایی‌شده حذف نشوند؛ اصلاحات از طریق سند اصلاحی انجام شوند.

8. COMMISSION ENGINE

موتور کمیسیون مستقل بساز.

امکانات:

- تعریف قوانین کمیسیون
- انواع معامله
- نرخ‌ها و مبالغ ثابت
- فرمول‌های قابل تنظیم
- تاریخ شروع و پایان اعتبار قانون
- محاسبه سهم مشاور
- سهم مدیر فروش
- سهم آژانس
- ثبت توافق اختصاصی
- پیش‌نمایش محاسبه
- تأیید مدیر
- تسویه
- گزارش سوابق

هیچ نرخ قانونی یا فرمول رسمی را بدون منبع معتبر و تنظیم مدیر به‌صورت ثابت فرض نکن.

نسخه قانون و پارامترهای هر محاسبه ذخیره شوند.

9. TEAM & RBAC

سیستم نقش و مجوز پیشرفته.

نقش‌های اولیه:

- Super Admin
- Agency Owner
- Branch Manager
- Sales Manager
- Agent
- Accountant
- Receptionist
- Custom Role

سطح دسترسی:

- Tenant
- Branch
- Assigned Records
- Own Records
- Financial
- Documents
- Reports
- Administration

امکان تعریف نقش سفارشی وجود داشته باشد.

مجوزها باید در Backend بررسی شوند.

مدیر هر شعبه نباید به‌طور خودکار به اطلاعات سایر شعب دسترسی داشته باشد.

10. ACTIVITIES & CALENDAR

- تماس‌ها
- جلسات
- بازدیدها
- وظایف
- یادآوری‌ها
- پیگیری مشتری
- تقویم روزانه
- تقویم هفتگی
- تقویم ماهانه
- تخصیص مسئول
- وضعیت انجام
- اولویت
- اعلان موعد

از تداخل زمانی بازدیدها و جلسات جلوگیری کن.

11. MARKETING ENGINE

- تولید آگهی از فایل ملک
- طراحی پوستر
- قالب استوری
- کپشن تبلیغاتی
- واترمارک
- QR Code
- لینک عمومی ملک
- صفحه اختصاصی آژانس
- مدیریت منابع جذب مشتری
- تحلیل بازده تبلیغات
- خروجی تصاویر استاندارد

انتشار در سرویس‌های خارجی فقط با API رسمی یا روش مجاز انجام شود.

12. DOCUMENT CENTER

- آرشیو اسناد
- دسته‌بندی
- پرونده ملک
- پرونده مشتری
- پرونده معامله
- نسخه‌بندی
- پیش‌نمایش
- دانلود امن
- ثبت دسترسی
- سیاست نگهداری
- محدودیت فایل
- بررسی نوع و محتوای فایل
- اسکن امنیتی در صورت امکان

13. AI ASSISTANT

یک لایه هوش مصنوعی ماژولار بساز.

قابلیت‌ها:

- جستجوی زبان طبیعی
- تبدیل درخواست فارسی به فیلترهای ساختاریافته
- خلاصه‌سازی سوابق مشتری
- پیشنهاد فایل مناسب
- تحلیل عملکرد مشاور
- پیشنهاد پیگیری
- تولید توضیحات آگهی
- تولید محتوای تبلیغاتی
- تحلیل روند قیمت در داده‌های موجود

قوانین:

- AI حق دسترسی نامحدود به دیتابیس ندارد.
- درخواست‌ها از طریق سرویس‌های مجاز و کنترل‌شده اجرا شوند.
- اطلاعات حساس بدون مجوز در اختیار مدل قرار نگیرند.
- خروجی تخمینی قیمت به‌عنوان قیمت قطعی معرفی نشود.
- عملیات مالی و قراردادی بدون تأیید انسانی انجام نشوند.
- قابلیت AI باید قابل غیرفعال‌سازی باشد.

14. REPORTING & ANALYTICS

گزارش‌ها:

- عملکرد مشاوران
- عملکرد شعب
- تعداد فایل‌ها
- تعداد مشتریان
- نرخ تبدیل
- معاملات موفق
- معاملات ناموفق
- متوسط زمان معامله
- درآمد کمیسیون
- هزینه‌ها
- سود و زیان
- محبوب‌ترین مناطق
- املاک پربازدید
- منابع جذب مشتری
- گزارش بازدیدها
- گزارش فعالیت کارکنان

فیلتر بر اساس بازه زمانی، شعبه، مشاور، نوع معامله و وضعیت.

خروجی Excel و PDF با پشتیبانی کامل فارسی.

15. SAAS & SUBSCRIPTION MANAGEMENT

مدل تجاری Hybrid.

SaaS:

- پلن‌های مختلف
- اشتراک ماهانه
- اشتراک سالانه
- تعداد کاربران
- تعداد شعب
- محدودیت فضای ذخیره‌سازی
- محدودیت امکانات
- تمدید
- لغو
- فاکتور اشتراک
- پرداخت آنلاین
- وضعیت پرداخت
- Grace Period

Dedicated:

- استقرار اختصاصی
- دیتابیس مستقل
- فضای ذخیره‌سازی مستقل
- تنظیمات اختصاصی
- پشتیبان‌گیری مستقل
- مدیریت نسخه
- امکان قرارداد خدمات اختصاصی

Feature Entitlements باید در Backend اعمال شوند.

16. UI/UX — MINIMAL PREMIUM

سبک بصری:

Minimal Enterprise.

رابط کاربری باید حرفه‌ای، ساده، دقیق و مدرن باشد.

رنگ هویتی:
KarenSoft Neon Green

پالت:

- Primary: #9FFF00
- Text: #18181B
- Background: #F5F6F8
- Surface: #FFFFFF
- Border: #E4E4E7
- Secondary Text: #71717A

فونت:
Vazirmatn

الزامات:

- RTL کامل
- Sidebar حرفه‌ای
- Header ثابت و کاربردی
- Dashboard قابل تنظیم
- کارت‌های آماری ظریف
- جداول حرفه‌ای
- فیلترهای قابل ذخیره
- فرم‌های چندمرحله‌ای
- Dialog و Drawer
- Toast Notifications
- Loading States
- Empty States
- Error States
- Skeleton Loading
- Dark Mode اختیاری
- Responsive Design
- Accessibility

از Glassmorphism افراطی، گرادیان‌های بی‌هدف، انیمیشن‌های سنگین و کارت‌های تزئینی زیاد خودداری کن.

سادگی و سرعت استفاده بر جلوه‌های بصری اولویت دارد.

17. GLOBAL SEARCH

جستجوی سراسری باید بتواند موارد زیر را پیدا کند:

- کد ملک
- آدرس
- نام مالک
- شماره تماس
- مشتری
- قرارداد
- معامله
- مشاور
- کد پرونده

نتایج بر اساس سطح دسترسی فیلتر شوند.

18. SECURITY REQUIREMENTS

- Secure Authentication
- Password Hashing
- Session Management
- Refresh Token Rotation در صورت استفاده از JWT
- Rate Limiting
- CSRF Protection متناسب با مدل احراز هویت
- XSS Protection
- SQL Injection Protection
- Input Validation
- RBAC
- Tenant Isolation
- Audit Logging
- Secure File Upload
- Signed Download URLs
- Backup Encryption
- Secrets Management
- Security Headers
- Dependency Scanning

برای حذف اطلاعات، تأیید و سیاست نگهداری مشخص داشته باش.

عملیات حساس شامل تغییر سطح دسترسی، اطلاعات مالی و اسناد قرارداد باید در Audit Log ثبت شوند.

19. DATABASE REQUIREMENTS

ساختار دیتابیس باید شامل موجودیت‌های زیر باشد:

Identity:
tenants, users, employees, roles, permissions, subscriptions

Property:
properties, property_types, property_features, property_media, property_documents, property_owners, property_price_history

CRM:
contacts, customers, leads, customer_requirements, lead_assignments, activities, follow_ups

Matching:
property_matches, matching_rules, matching_history

Transactions:
transactions, transaction_parties, transaction_properties, transaction_stages

Contracts:
contracts, contract_templates, contract_versions, contract_parties, contract_amendments

Finance:
financial_accounts, financial_transactions, journal_entries, journal_lines, invoices, invoice_items

Commission:
commission_rules, commission_calculations, commission_shares, settlements

Operations:
branches, tasks, appointments, notifications, files, audit_logs, integrations

تمام جداول سازمانی باید Tenant-aware باشند.

از Foreign Key، Unique Constraints، Check Constraints، Indexes و Transaction Management استفاده کن.

برای داده‌های حجیم از Pagination و Query Optimization استفاده کن.

Migrationها نسخه‌بندی شوند.

20. TESTING & QUALITY ENGINEERING

تست‌های اجباری:

Unit Tests:

- محاسبه کمیسیون
- تبدیل واحد پول
- تطبیق مشتری و ملک
- قوانین دسترسی
- گردش مالی

Integration Tests:

- ثبت ملک
- ثبت مشتری
- ایجاد معامله
- ثبت قرارداد
- ثبت دریافت
- محاسبه کمیسیون

E2E:

- ورود کاربر
- ثبت ملک
- ثبت مشتری
- تطبیق
- ایجاد معامله
- قرارداد
- تسویه
- گزارش نهایی

Security Tests:

- Cross-Tenant Access
- Privilege Escalation
- IDOR
- Unauthorized File Access
- Authentication Bypass

Regression Tests:
پس از هر تغییر، عملکردهای قبلی حفظ شوند.

21. DEVELOPMENT ROADMAP

مرحله 0:
Audit و مستندسازی.

مرحله 1:
Foundation، Authentication، Tenant، RBAC و Database.

مرحله 2:
Property Management.

مرحله 3:
CRM و Smart Matching.

مرحله 4:
Transactions و Contracts.

مرحله 5:
Finance و Commission.

مرحله 6:
Branches، Team، Calendar و Reporting.

مرحله 7:
Marketing و AI.

مرحله 8:
SaaS، Dedicated Deployment و Production Hardening.

هیچ مرحله‌ای بدون تست و تأیید کیفیت بسته نشود.

22. DEFINITION OF DONE

هر قابلیت زمانی کامل است که:

- رابط کاربری نهایی باشد.
- API واقعی داشته باشد.
- دیتابیس واقعی داشته باشد.
- Validation کامل داشته باشد.
- Authorization داشته باشد.
- Error Handling داشته باشد.
- Loading و Empty State داشته باشد.
- تست خودکار داشته باشد.
- در موبایل کار کند.
- در RTL درست نمایش داده شود.
- مستندات آن تکمیل باشد.

23. FINAL DELIVERABLES

خروجی پروژه:

1. نرم‌افزار عملیاتی مدیریت املاک.
2. داشبورد مدیریت آژانس.
3. پنل مشاوران.
4. فایلینگ حرفه‌ای.
5. CRM کامل.
6. سیستم معاملات و قراردادها.
7. موتور مالی و کمیسیون.
8. سیستم مدیریت کارکنان.
9. گزارش‌های مدیریتی.
10. سیستم چندمستاجری.
11. پنل مدیریت اشتراک.
12. دستیار هوشمند.
13. مستندات معماری.
14. مستندات API.
15. مستندات دیتابیس.
16. تست‌های خودکار.
17. Docker Configuration.
18. CI/CD Pipeline.
19. Backup & Recovery Plan.
20. راهنمای استقرار و نگهداری.

24. EXECUTION PROTOCOL

کار را به ترتیب انجام بده:

STEP 1:
بررسی کامل پروژه موجود و ارائه گزارش Audit.

STEP 2:
ارائه معماری نهایی و نقشه مهاجرت.

STEP 3:
طراحی دیتابیس و ERD.

STEP 4:
ایجاد Design System و ساختار رابط کاربری.

STEP 5:
پیاده‌سازی زیرساخت و احراز هویت.

STEP 6:
توسعه ماژول‌ها به ترتیب نقشه راه.

STEP 7:
تست و رفع کامل مشکلات.

STEP 8:
آماده‌سازی Production و مستندات.

در هر مرحله موارد زیر را گزارش کن:

- کارهای انجام‌شده
- فایل‌های ایجادشده
- فایل‌های تغییرکرده
- قابلیت‌های عملیاتی
- تست‌های اجراشده
- خطاهای باقی‌مانده
- ریسک‌های شناسایی‌شده
- مرحله بعدی

اگر محدودیت محیط یا دسترسی وجود دارد، آن را شفاف گزارش بده.

از اعلام تکمیل قابلیت‌هایی که واقعاً اجرا و تست نشده‌اند خودداری کن.

---

FINAL MISSION

یک محصول Enterprise واقعی، پایدار، امن، مقیاس‌پذیر و قابل فروش برای بازار آژانس‌های املاک ایران بساز.

این محصول باید از نظر کیفیت مهندسی، تجربه کاربری، مدیریت اطلاعات، امنیت و قابلیت توسعه در سطح محصولات حرفه‌ای بین‌المللی باشد.

اصل نهایی:

BUILD A REAL PRODUCT.
NOT A DEMO.
NOT A STATIC DASHBOARD.
NOT A COLLECTION OF MOCK SCREENS.

یک سیستم واقعی بساز که یک آژانس املاک بتواند عملیات روزانه خود را به‌طور کامل به آن بسپارد.

اول Audit، سپس معماری، سپس توسعه مرحله‌ای، سپس تست و انتشار.

KarenSoft — Intelligence in Every Operation.

---

## رابط کاربری اولیه ملکینو

برای اجرای پیش‌نمایش رابط کاربری:

```bash
npm install
npm run dev
```

برای بررسی ساخت Production:

```bash
npm run build
```

رابط فارسی/RTL در صورت پیکربندی به Supabase Auth و API متصل می‌شود و دادهٔ نمونه/localStorage را نمایش یا ذخیره نمی‌کند. فایلینگ، CRM مشتریان و پیگیری‌های تماس/جلسه/بازدید/یادآوری در کد به API متصل‌اند؛ معاملات، مالی و گزارش‌ها عملیاتی نیستند. بدون متغیرهای محیطی لازم، برنامه صفحهٔ راه‌اندازی نشان می‌دهد. DB اختصاصی ملکینو هنوز انتخاب نشده، بنابراین migration واقعی اجرا یا استقرار cPanel انجام نشده است؛ اعلان خودکار و تقویم کامل نیز هنوز فعال نیستند.

### وضعیت توسعهٔ فایلینگ

جریان فایلینگ پیاده‌سازی‌شده از API برای بارگذاری و ذخیرهٔ فایل، تغییر وضعیت، بایگانی/بازگردانی و CSV استفاده می‌کند؛ تصویر داده‌ها فقط پس از ورود و پیکربندی env نمایش داده می‌شود. دیتابیس واقعی هنوز انتخاب نشده است؛ بنابراین migration روی آن اجرا نشده و هیچ پروژهٔ Supabase نامرتبطی تغییر نکرده است. جزئیات در `docs/EXECUTION_PROMPT_PROPERTIES.md` و `api/README.md` آمده.

### زیربنای API (آمادهٔ اتصال؛ هنوز اجرا/متصل نشده)

```bash
cp .env.example .env   # مقدارهای واقعی فقط در env محلی/مدیریت اسرار
npm run db:migrate    # فقط پس از انتخاب DB اختصاصی ملکینو و بازبینی migration
npm run api:dev
```

API در NestJS با Drizzle/PostgreSQL مسیرهای فایلینگ نسخهٔ v1، اعتبارسنجی server-side، Supabase JWT/JWKS، عضویت tenant/branch و RLS دارد. UI فایلینگ در صورت تنظیم env از این API استفاده می‌کند. Migration در PGlite تست شده، نه روی DB ملکینو واقعی؛ شرایط استقرار cPanel در `docs/CPANEL_DEPLOYMENT.md` و محدودیت‌های نقش DB در `api/README.md` ثبت شده‌اند.
