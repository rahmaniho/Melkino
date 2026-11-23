# طرح پایگاه داده — پیش‌نویس

این سند نسخهٔ اولیهٔ طرح است. مهاجرت‌های `0001_tenant_properties`، `0002_customer_crm` و `0003_customer_follow_ups` در `api/migrations/` افزوده شده‌اند و در PGlite اجرا/تست شده‌اند، اما روی PostgreSQL ملکینو اجرا نشده‌اند.

## دامنه‌های پیشنهادی
- هویت: tenants, users, memberships, roles, permissions, branches.
- ملک: properties, property_types, features, media, owners, price_history.
- CRM پایه: `customers` برای تماس/نیاز/بودجه و `customer_audit_log`; پیگیری‌های تماس/جلسه/بازدید/یادآوری با وضعیت و `follow_up_audit_log` در migration `0003`; تطبیق، درخواست‌ها و تاریخچهٔ کامل تعامل هنوز در مراحل بعدی‌اند.
- تطبیق: matching_rules, property_matches, matching_history.
- معامله و قرارداد: transactions, parties, stages, contracts, versions, amendments.
- مالی: accounts, financial_transactions, journal_entries, journal_lines, invoices.
- کمیسیون: commission_rules, calculations, shares, settlements.
- عملیات: tasks, appointments, files, notifications, audit_logs, integrations.

## اصول طراحی پیش از Migration
- شناسه tenant از context احراز هویت‌شده استخراج شود؛ tenant_id همه رکوردهای سازمانی را scope کند.
- FK، unique/check constraints، ایندکس‌های tenant-aware و تراکنش‌های DB تعریف شوند.
- پول با Decimal و currency/unit صریح ذخیره شود؛ واحد تومان/ریال بدون تبدیل ضمنی.
- سند مالی نهایی حذف/ویرایش نشود؛ اصلاح از طریق سند معکوس/اصلاحی باشد.
- فایل و سند حساس دارای policy دسترسی، retention و audit باشند.
- ERD و migration واقعی باید پس از انتخاب ORM و بررسی نیازهای گزارش/عملیات تهیه شوند.
