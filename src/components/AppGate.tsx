import type { FormEvent } from 'react';
import { Building2, LockKeyhole, Mail, Settings2 } from 'lucide-react';

const logoUrl = `${import.meta.env.BASE_URL}assets/melkino-logo.png`;

export function SetupScreen(){
 return <main className="gate-page" dir="rtl"><section className="gate-card"><img className="gate-logo" src={logoUrl} alt="ملکینو"/><div className="gate-icon"><Settings2 size={22}/></div><h1>پیکربندی محیط ملکینو</h1><p>برای اتصال امن برنامه به API و آژانس، متغیرهای محیطی فرانت‌اند را در تنظیمات build هاست cPanel تنظیم کنید.</p><ol><li><code>VITE_SUPABASE_URL</code> و <code>VITE_SUPABASE_ANON_KEY</code> برای ورود کاربران</li><li><code>VITE_TENANT_ID</code> و <code>VITE_DEFAULT_BRANCH_ID</code> برای محدوده آژانس و شعبه</li><li>مسیر نسبی <code>/api</code> باید به برنامه Node.js API متصل شود.</li></ol><div className="gate-warning">هیچ داده نمونه‌ای نمایش داده نمی‌شود. تا زمان پیکربندی، برنامه به‌صورت امن متوقف می‌ماند.</div></section></main>
}

export function NoticeScreen({title,message}:{title:string;message:string}){return <main className="gate-page" dir="rtl"><section className="gate-card gate-loading"><img className="gate-logo" src={logoUrl} alt="ملکینو"/><div className="gate-spinner"/><h1>{title}</h1><p>{message}</p></section></main>}

export function LoginScreen({email,setEmail,password,setPassword,busy,error,onSubmit}:{email:string;setEmail:(value:string)=>void;password:string;setPassword:(value:string)=>void;busy:boolean;error:string;onSubmit:(event:FormEvent)=>void}){
 return <main className="gate-page" dir="rtl"><form className="gate-card login-card" onSubmit={onSubmit}><img className="gate-logo" src={logoUrl} alt="ملکینو"/><div className="gate-icon"><Building2 size={22}/></div><h1>ورود به ملکینو</h1><p>برای مشاهده اطلاعات آژانس، با حساب کاربری تأییدشده وارد شوید.</p><label className="gate-field"><span>ایمیل</span><div><Mail size={17}/><input type="email" autoComplete="username" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@example.com"/></div></label><label className="gate-field"><span>گذرواژه</span><div><LockKeyhole size={17}/><input type="password" autoComplete="current-password" required minLength={6} value={password} onChange={event=>setPassword(event.target.value)} placeholder="گذرواژه حساب کاربری"/></div></label>{error&&<div className="gate-error" role="alert">{error}</div>}<button className="btn-primary gate-submit" disabled={busy}>{busy?'در حال ورود…':'ورود امن به حساب'}</button><small>حساب‌ها باید از قبل توسط مدیر آژانس ایجاد شده باشند.</small></form></main>
}
