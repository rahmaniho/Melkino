# پیش‌نمایش ملکینو روی GitHub Pages

با هر push به `main` یا شاخه‌های `arena/**`، GitHub Actions تست‌ها و build را اجرا می‌کند. فقط push به `main` محتوای `dist/` را روی GitHub Pages منتشر می‌کند؛ push شاخهٔ PR برای build/test است. اجرای دستی workflow نیز از بخش Actions ممکن است. تنظیم فعلی Environment مخزن، انتشار را به `main` محدود کرده است؛ بنابراین URL عمومی پس از merge شدن PR به‌روزرسانی می‌شود.

نشانی Pages مخزن: <https://rahmaniho.github.io/Melkino/>

انتشار Pages یک لندینگ پیج فارسی برای معرفی برنامه است؛ build عمومی با `VITE_PUBLIC_LANDING=true` از ورود و پنل عملیاتی جدا می‌ماند. چون هنوز محیط اختصاصی Supabase/PostgreSQL ملکینو انتخاب نشده، workflow هیچ credential یا دادهٔ ساختگی تزریق نمی‌کند. CRM/API از Pages عملیاتی نیستند. برای استفادهٔ واقعی، محیط اختصاصی و API میزبانی‌شده باید جداگانه پیکربندی شوند. اطلاعات محرمانه را در GitHub Pages یا متغیرهای `VITE_*` قرار ندهید.

Vite در buildهای Actions از base path مخزن (`/Melkino/`) استفاده می‌کند؛ build عادی برای cPanel همچنان از `/` استفاده می‌کند.
