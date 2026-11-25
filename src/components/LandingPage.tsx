import { useState } from 'react';
import { ArrowLeft, ArrowUpLeft, Building2, CalendarCheck2, Check, ClipboardList, LockKeyhole, MapPin, Users, LayoutDashboard } from 'lucide-react';
import './landing.css';

const base = import.meta.env.BASE_URL;
const productScreens=[
  {title:'نمای کلی آژانس',description:'چیدمان صفحهٔ دید کلی و خلاصهٔ بخش‌های اصلی محصول.',image:'melkino-preview-dashboard.png',Icon:LayoutDashboard},
  {title:'فایل‌های املاک',description:'نمایی از جست‌وجو، فیلترها و جدول مدیریت فایل.',image:'melkino-preview-properties.png',Icon:Building2},
  {title:'مشتریان و پیگیری',description:'نمایی از فضای CRM و برنامه‌ریزی تماس و بازدید.',image:'melkino-preview-crm.png',Icon:CalendarCheck2},
];

export function LandingPage(){
  const [activeScreen,setActiveScreen]=useState(0);
  const screen=productScreens[activeScreen];
  return <main className="landing" dir="rtl">
    <header className="landing-nav">
      <a href="#home" className="landing-brand" aria-label="ملکینو، خانه"><img className="landing-brand-mark" src={`${base}assets/melkino-app-icon.png`} alt=""/><span className="landing-brand-copy"><b>ملکینو</b><small>مدیریت هوشمند املاک</small></span></a>
      <nav aria-label="ناوبری اصلی"><a href="#features">امکانات</a><a href="#workflow">جریان کار</a><a href="#readiness">وضعیت پیش‌نمایش</a></nav>
      <a className="landing-nav-cta" href="#features">آشنایی با ملکینو <ArrowLeft size={15}/></a>
    </header>

    <section className="landing-hero" id="home">
      <div className="landing-hero-copy">
        <span className="landing-kicker"><i/> راهکاری فارسی برای آژانس‌های املاک</span>
        <h1>از ثبت فایل تا پیگیری مشتری؛<br/><em>همه‌چیز منظم، یک‌جا.</em></h1>
        <p>ملکینو برای ساماندهی کار روزانهٔ آژانس طراحی شده؛ فایل‌های ملکی، دفتر مشتریان و برنامهٔ پیگیری‌ها را در یک تجربهٔ فارسی و ساده کنار هم می‌آورد.</p>
        <div className="landing-actions"><a className="landing-button primary" href="#features">امکانات ملکینو <ArrowLeft size={17}/></a><a className="landing-button secondary" href="#readiness">وضعیت راه‌اندازی <ArrowUpLeft size={16}/></a></div>
        <div className="landing-assurance"><span><Check size={14}/> رابط کاملاً فارسی</span><span><Check size={14}/> بدون دادهٔ واقعی یا نمایشی</span><span><Check size={14}/> صفحهٔ معرفی، نه پنل عملیاتی</span></div>
      </div>
      <div className="landing-hero-art" role="img" aria-label="تصویر مفهومی امکانات ملکینو">
        <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
        <div className="product-preview-card">
          <div className="preview-card-head"><div className="preview-brand-icon"><img src={`${base}assets/melkino-app-icon.png`} alt=""/></div><div><b>پنل مدیریت آژانس</b><small>نمای کلی امکانات</small></div><span className="preview-pill"><i/> پیش‌نمایش</span></div>
          <div className="preview-welcome"><span>به ملکینو خوش آمدید</span><b>ابزارهای روزمرهٔ آژانس،<br/>در یک مسیر روشن</b></div>
          <div className="preview-feature-list">
            <div><span className="preview-symbol file"><Building2 size={17}/></span><span><b>فایل‌های املاک</b><small>ثبت و ساماندهی فایل‌ها</small></span><ArrowLeft size={14}/></div>
            <div><span className="preview-symbol people"><Users size={17}/></span><span><b>مشتریان و سرنخ‌ها</b><small>نیازها و ارتباط‌های مشتری</small></span><ArrowLeft size={14}/></div>
            <div><span className="preview-symbol tasks"><CalendarCheck2 size={17}/></span><span><b>تقویم و پیگیری</b><small>تماس، جلسه و بازدید</small></span><ArrowLeft size={14}/></div>
          </div>
          <div className="preview-card-foot"><LockKeyhole size={13}/> محیط عملیاتی نیازمند پیکربندی آژانس است</div>
        </div>
        <span className="floating-tag tag-rtl"><span>فا</span> فارسی و راست‌چین</span>
        <span className="floating-tag tag-organized"><ClipboardList size={15}/> فایل تا پیگیری</span>
      </div>
    </section>

    <div className="landing-ribbon"><span>سامانهٔ مدیریت املاک ملکینو</span><i/><span>فایلینگ</span><i/><span>CRM مشتریان</span><i/><span>پیگیری‌های زمان‌بندی‌شده</span><i/><span>چندشعبه‌ای</span></div>

    <section className="landing-section product-screens-section" id="screens">
      <div className="section-intro"><span className="landing-kicker"><i/> فضای کاری ملکینو</span><h2>محیط برنامه را ببینید</h2><p>تصاویر مفهومی از سه بخش اصلی رابط؛ برای معرفی چیدمان، نه نمایش اطلاعات عملیاتی.</p></div>
      <div className="screen-showcase">
        <div className="screen-tabs" role="tablist" aria-label="بخش‌های محیط برنامه">{productScreens.map((item,index)=><button key={item.image} type="button" id={`screen-tab-${index}`} role="tab" aria-controls="product-screen-panel" aria-selected={activeScreen===index} tabIndex={activeScreen===index?0:-1} className={activeScreen===index?'active':''} onClick={()=>setActiveScreen(index)} onKeyDown={event=>{let next=activeScreen;if(event.key==='ArrowLeft')next=(activeScreen+1)%productScreens.length;else if(event.key==='ArrowRight')next=(activeScreen+productScreens.length-1)%productScreens.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=productScreens.length-1;else return;event.preventDefault();setActiveScreen(next);document.getElementById(`screen-tab-${next}`)?.focus();}}><item.Icon size={16}/><span>{item.title}</span></button>)}</div>
        <figure className="screen-figure" id="product-screen-panel" role="tabpanel" aria-labelledby={`screen-tab-${activeScreen}`} aria-live="polite"><div className="screen-image-wrap"><img key={screen.image} src={`${base}assets/${screen.image}`} alt={`تصویر مفهومی محیط ملکینو: ${screen.title}`} loading="lazy"/><span className="screen-image-badge"><i/> تصویر مفهومی رابط</span></div><figcaption><span><b>{screen.title}</b><small>{screen.description}</small></span><span className="screen-counter">۰{activeScreen+1} <i/> ۰۳</span></figcaption></figure>
        <p className="screen-disclaimer">این تصاویر برای نمایش بصری طراحی تولید شده‌اند؛ دادهٔ داخل آن‌ها واقعی نیست و این صفحه به سامانهٔ آژانس متصل نیست.</p>
      </div>
    </section>

    <section className="landing-section features-section" id="features">
      <div className="section-intro"><span className="landing-kicker"><i/> یک مسیر پیوسته برای کار آژانس</span><h2>ابزارهایی برای نظمِ کار روزانه</h2><p>از اطلاعات ملک و نیاز مشتری تا گام بعدی ارتباط؛ قابلیت‌ها در کنار هم طراحی شده‌اند تا کارها پراکنده نمانند.</p></div>
      <div className="feature-grid">
        <article className="feature-card"><span className="feature-icon lime"><Building2 size={21}/></span><span className="feature-index">۰۱</span><h3>فایلینگ املاک</h3><p>ثبت و ویرایش فایل، جست‌وجو، وضعیت‌گذاری، بایگانی و خروجی اطلاعات.</p><span className="feature-meta">مدیریت فایل در سطح آژانس و شعبه</span></article>
        <article className="feature-card"><span className="feature-icon blue"><Users size={21}/></span><span className="feature-index">۰۲</span><h3>دفتر مشتریان</h3><p>اطلاعات تماس، نوع نیاز، محدوده و بودجه را در یک پروندهٔ مشتری نگه دارید.</p><span className="feature-meta">جست‌وجو، مرحله‌بندی و پیگیری CRM</span></article>
        <article className="feature-card"><span className="feature-icon purple"><CalendarCheck2 size={21}/></span><span className="feature-index">۰۳</span><h3>برنامهٔ پیگیری</h3><p>برای تماس، جلسه، بازدید ملک یا یادآوری، گام بعدی ارتباط را ثبت کنید.</p><span className="feature-meta">پیوند پیگیری به مشتری و فایل مرتبط</span></article>
      </div>
    </section>

    <section className="landing-workflow" id="workflow">
      <div className="workflow-copy"><span className="landing-kicker"><i/> ساده و مرحله‌به‌مرحله</span><h2>فرصت‌ها را از دست ندهید؛<br/>گام بعدی را روشن کنید.</h2><p>ملکینو جریان کار را از ثبت اطلاعات تا ارتباط بعدی قابل‌پیگیری می‌کند. اطلاعات ساختگی در این پیش‌نمایش نمایش داده نمی‌شود.</p><a href="#readiness">دربارهٔ وضعیت نسخه <ArrowLeft size={16}/></a></div>
      <div className="workflow-steps">
        <div className="workflow-step"><span>۱</span><div><b>ثبت فایل و نیاز مشتری</b><small>اطلاعات مرتب و قابل جست‌وجو</small></div><Building2 size={19}/></div>
        <div className="workflow-connector"/>
        <div className="workflow-step"><span>۲</span><div><b>برنامه‌ریزی ارتباط</b><small>تماس، جلسه یا بازدید را زمان‌بندی کنید</small></div><CalendarCheck2 size={19}/></div>
        <div className="workflow-connector"/>
        <div className="workflow-step"><span>۳</span><div><b>ادامهٔ مسیر در یک پرونده</b><small>مشتری و پیگیری مرتبط کنار هم</small></div><Users size={19}/></div>
      </div>
    </section>

    <section className="landing-security" id="security"><div className="security-mark"><LockKeyhole size={23}/></div><div><span className="landing-kicker">حریم خصوصی از ابتدا</span><h2>اطلاعات هر آژانس، در محدودهٔ خودش</h2><p>زیرساخت برنامه برای جداسازی مستأجر و شعبه و کنترل دسترسی نقش‌ها طراحی و در آزمون‌های پایگاه داده پوشش داده شده است. این صفحهٔ عمومی به هیچ داده یا سرویس آژانسی متصل نیست.</p></div><div className="security-note"><Check size={16}/> پیش‌نمایش بدون دادهٔ مشتری</div></section>

    <section className="landing-readiness" id="readiness"><div className="readiness-copy"><span className="landing-kicker"><i/> شفاف دربارهٔ وضعیت</span><h2>پیش‌نمایش آنلاین است؛<br/>اتصال عملیاتی جداگانه راه‌اندازی می‌شود.</h2><p>این استقرار فقط صفحهٔ معرفی عمومی است و به پنل مدیریت، حساب کاربری یا داده‌های واقعی وصل نیست. برای استفادهٔ عملیاتی، زیرساخت اختصاصی، احراز هویت و پایگاه داده باید جداگانه راه‌اندازی و آزموده شوند.</p></div><div className="readiness-card"><div className="readiness-card-head"><span className="readiness-dot"/><b>وضعیت نسخهٔ عمومی</b><small>نسخهٔ معرفی</small></div><div className="readiness-row"><span>صفحهٔ معرفی</span><b className="ready-status">در دسترس</b></div><div className="readiness-row"><span>اتصال به دادهٔ آژانس</span><b className="pending-status">پیکربندی‌نشده</b></div><div className="readiness-row"><span>ورود به سامانه</span><b className="pending-status">در این پیش‌نمایش غیرفعال</b></div><div className="readiness-card-note"><MapPin size={14}/> بدون اتصال به Supabase یا API در نسخهٔ عمومی</div></div></section>

    <footer className="landing-footer"><a href="#home" className="landing-brand footer-brand"><img src={`${base}assets/melkino-logo.png`} alt="ملکینو"/></a><span>ملکینو؛ نظمِ بیشتر برای کار روزانهٔ آژانس املاک</span><a href="#home">بازگشت به بالا ↑</a></footer>
  </main>
}
