import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/700.css';
import './style.css';
import { exportPropertiesCsv, type Property, type PropertyDraft } from './domain/properties';
import { apiRequest, authProblemMessage, backendConfigured, defaultBranchId, mapProperty, supabase, type ApiProperty, type PropertyWrite } from './lib/backend';
import type { Session } from '@supabase/supabase-js';
import { LoginScreen, NoticeScreen, SetupScreen } from './components/AppGate';
import { CustomersPage } from './components/CustomersPage';
import { CustomerForm } from './components/CustomerForm';
import { mapCustomer, type CustomerDraft, type CustomerRecord, type CustomerView } from './domain/customers';
import { FollowUpsPage, type FollowUpDraft } from './components/FollowUpsPage';
import { mapFollowUp, type FollowUpRecord, type FollowUpView } from './domain/follow-ups';
import {
  Activity, ArrowDownLeft, ArrowLeft, ArrowUpLeft, ArrowUpRight, Bell, Building2, CalendarDays,
  Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Command, FileText, Filter,
  Home, LayoutDashboard, LogOut, MapPin, Menu, MessageCircle, MoreHorizontal, Plus, Search, CalendarClock,
  Settings2, SlidersHorizontal, Sparkles, Users, Wallet, X, BedDouble, Ruler, Eye, Phone,
  Pencil, Archive, ArchiveRestore, Download,
  ClipboardList, ChartNoAxesCombined, BriefcaseBusiness, Landmark, ShieldCheck, CheckCheck,
} from 'lucide-react';

const navSections = [
  {label:'میز کار', items:[['نمای کلی',LayoutDashboard],['فایل‌های املاک',Building2],['مشتریان و سرنخ‌ها',Users],['معاملات',BriefcaseBusiness]]},
  {label:'مدیریت', items:[['تقویم و پیگیری',CalendarDays],['مالی و کمیسیون',Wallet],['گزارش‌ها',ChartNoAxesCombined],['اسناد و قراردادها',FileText]]},
];
const fa = (n:number) => new Intl.NumberFormat('fa-IR').format(n);
const titleToView:Record<string,string> = {'نمای کلی':'dashboard','فایل‌های املاک':'properties','مشتریان و سرنخ‌ها':'customers','معاملات':'transactions','تقویم و پیگیری':'calendar','مالی و کمیسیون':'finance','گزارش‌ها':'reports','اسناد و قراردادها':'documents'};

function App(){
  const [view,setView]=useState('dashboard');
  const [properties,setProperties]=useState<Property[]>([]);
  const [customers,setCustomers]=useState<CustomerView[]>([]); const [loadingCustomers,setLoadingCustomers]=useState(false); const [customerModal,setCustomerModal]=useState(false); const [editingCustomer,setEditingCustomer]=useState<CustomerView|null>(null); const [savingCustomer,setSavingCustomer]=useState(false);
  const [followUps,setFollowUps]=useState<FollowUpView[]>([]);const [loadingFollowUps,setLoadingFollowUps]=useState(false);const [savingFollowUp,setSavingFollowUp]=useState(false);const [followUpCustomerId,setFollowUpCustomerId]=useState('');const [followUpError,setFollowUpError]=useState('');
  const [session,setSession]=useState<Session|null>(null); const [authReady,setAuthReady]=useState(false); const [loadingProperties,setLoadingProperties]=useState(false); const [backendError,setBackendError]=useState(''); const [apiConnection,setApiConnection]=useState<'checking'|'connected'|'failed'>('checking');
  const [loginEmail,setLoginEmail]=useState(''); const [loginPassword,setLoginPassword]=useState(''); const [authBusy,setAuthBusy]=useState(false); const [authError,setAuthError]=useState('');
  const [query,setQuery]=useState(''); const [modal,setModal]=useState(false); const [mobileNav,setMobileNav]=useState(false);
  const [toast,setToast]=useState(''); const [toastIsError,setToastIsError]=useState(false); const [savingProperty,setSavingProperty]=useState(false); const [filter,setFilter]=useState('همه فایل‌ها');
  const emptyDraft:PropertyDraft={title:'',area:'',size:'',beds:'0',price:'',type:'APARTMENT',transaction:'SALE',currency:'IRT',deposit:'',monthlyRent:''};
  const [form,setForm]=useState<PropertyDraft>(emptyDraft); const [editingCode,setEditingCode]=useState<string|null>(null);
  useEffect(()=>{const handleShortcut=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();document.getElementById('global-search')?.focus()}};window.addEventListener('keydown',handleShortcut);return()=>window.removeEventListener('keydown',handleShortcut)},[]);
  useEffect(()=>{
    if(!supabase){setAuthReady(true);return}
    let alive=true;
    void supabase.auth.getSession().then(({data})=>{if(alive){setSession(data.session);setAuthReady(true)}}).catch(()=>{if(alive)setAuthReady(true)});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setAuthReady(true)});
    return()=>{alive=false;subscription.unsubscribe()}
  },[]);
  const refreshProperties=async(activeSession:Session)=>{
    setLoadingProperties(true);setBackendError('');setApiConnection('checking');
    try{
      const rows:ApiProperty[]=[]; let offset=0; let hasMore=true;
      while(hasMore){const page=await apiRequest<{data:ApiProperty[];pagination:{hasMore:boolean}}>('/properties?includeArchived=true&limit=100&offset='+offset,activeSession);rows.push(...page.data);hasMore=page.pagination.hasMore;offset+=page.data.length}
      const userName=String(activeSession.user.user_metadata?.full_name||activeSession.user.email||'کاربر');
      setProperties(rows.map(row=>mapProperty(row,activeSession.user.id,userName)));setApiConnection('connected');
    }catch(error){setApiConnection('failed');setBackendError(error instanceof Error?error.message:'دریافت فایل‌ها ناموفق بود.');}
    finally{setLoadingProperties(false)}
  };
  const refreshCustomers=async(activeSession:Session)=>{
    setLoadingCustomers(true);setBackendError('');setApiConnection('checking');
    try{
      const rows:CustomerRecord[]=[];let offset=0;let hasMore=true;
      while(hasMore){const page=await apiRequest<{data:CustomerRecord[];pagination:{hasMore:boolean}}>(`/customers?includeArchived=true&limit=100&offset=${offset}`,activeSession);rows.push(...page.data);hasMore=page.pagination.hasMore;offset+=page.data.length}
      const userName=String(activeSession.user.user_metadata?.full_name||activeSession.user.email||'کاربر');
      setCustomers(rows.map(record=>mapCustomer(record,activeSession.user.id,userName)));setApiConnection('connected');
    }catch(error){setApiConnection('failed');setBackendError(error instanceof Error?error.message:'دریافت مشتریان ناموفق بود.');}
    finally{setLoadingCustomers(false)}
  };
  useEffect(()=>{if(session&&backendConfigured)void refreshProperties(session);else setProperties([])},[session]);
  const refreshFollowUps=async(activeSession:Session)=>{
    setLoadingFollowUps(true);setFollowUpError('');setApiConnection('checking');
    try{
      const rows:FollowUpRecord[]=[];let offset=0;let hasMore=true;
      while(hasMore){const page=await apiRequest<{data:FollowUpRecord[];pagination:{hasMore:boolean}}>(`/follow-ups?limit=100&offset=${offset}`,activeSession);rows.push(...page.data);hasMore=page.pagination.hasMore;offset+=page.data.length}
      const userName=String(activeSession.user.user_metadata?.full_name||activeSession.user.email||'کاربر');
      setFollowUps(rows.map(record=>mapFollowUp(record,activeSession.user.id,userName)));setApiConnection('connected');
    }catch(error){setApiConnection('failed');setFollowUpError(error instanceof Error?error.message:'دریافت پیگیری‌ها ناموفق بود.');}
    finally{setLoadingFollowUps(false)}
  };
  const refreshDashboard=()=>{if(!session)return;void refreshProperties(session);void refreshFollowUps(session)};
  useEffect(()=>{if(session&&backendConfigured&&['customers','calendar'].includes(view))void refreshCustomers(session)},[session,view]);
  useEffect(()=>{if(session&&backendConfigured&&['dashboard','calendar'].includes(view))void refreshFollowUps(session)},[session,view]);
  const notify=(msg:string,isError=false)=>{setToast(msg);setToastIsError(isError);window.setTimeout(()=>setToast(''),3500)};
  const signIn=async(e:React.FormEvent)=>{e.preventDefault();if(!supabase)return;setAuthBusy(true);setAuthError('');try{const {error}=await supabase.auth.signInWithPassword({email:loginEmail.trim(),password:loginPassword});if(error)throw error;}catch(error){setAuthError(authProblemMessage(error instanceof Error?error.message:''))}finally{setAuthBusy(false)}};
  const signOut=async()=>{if(!supabase)return;await supabase.auth.signOut();setProperties([])};
  const filtered=useMemo(()=>properties.filter(p=>`${p.title} ${p.area} ${p.code} ${p.agent}`.includes(query.trim())).filter(p=>filter==='همه فایل‌ها'||p.status===filter),[properties,query,filter]);
  const selectView=(v:string)=>{setView(v);setMobileNav(false)};
  const openCreate=()=>{setEditingCode(null);setForm(emptyDraft);setModal(true)};
  const openEdit=(property:Property)=>{setEditingCode(property.id||null);setForm({title:property.title,area:property.area,size:String(property.size),beds:String(property.beds),type:({آپارتمان:'APARTMENT',ویلا:'VILLA',زمین:'LAND',تجاری:'COMMERCIAL',اداری:'OFFICE',سایر:'OTHER'} as Record<string,string>)[property.type]||'APARTMENT',transaction:property.transaction||'SALE',currency:property.currency==='ریال'?'IRR':'IRT',price:property.salePrice||'',deposit:property.deposit||'',monthlyRent:property.monthlyRent||'',status:property.apiStatus||'ACTIVE'});setModal(true)};
  const asLatin=(value:string)=>value.replace(/[۰-۹٠-٩]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)>=0?'۰۱۲۳۴۵۶۷۸۹'.indexOf(d):'٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const makeWriteBody=():PropertyWrite=>{
    const transaction=(form.transaction||'SALE') as PropertyWrite['transaction'];
    const body:PropertyWrite={branchId:defaultBranchId,title:form.title.trim(),address:form.area.trim(),type:(form.type||'APARTMENT') as PropertyWrite['type'],transaction,areaSqm:asLatin(form.size.trim()),bedrooms:Number(asLatin(form.beds||'0')),currency:(form.currency||'IRT') as PropertyWrite['currency']};
    const amount=(text:string)=>asLatin(text.trim()).replace(/[٬,\s]/g,'');
    if(transaction==='SALE')body.salePrice=amount(form.price);
    if(transaction==='RENT')body.monthlyRent=amount(form.monthlyRent||form.price);
    if(transaction==='MORTGAGE_RENT'){body.deposit=amount(form.deposit||'');body.monthlyRent=amount(form.monthlyRent||'')}
    if(editingCode&&form.status)body.status=form.status as ApiProperty['status'];
    return body;
  };
  const saveProperty=async(e:React.FormEvent)=>{e.preventDefault();if(!session||savingProperty)return;setSavingProperty(true);
    try{
      const body=makeWriteBody();
      if(!body.title||!body.address||!body.areaSqm||!Number.isFinite(body.bedrooms))throw new Error('عنوان، نشانی و متراژ را کامل وارد کنید.');
      if(body.transaction==='SALE'&&!body.salePrice)throw new Error('قیمت فروش را وارد کنید.');
      if(body.transaction==='RENT'&&!body.monthlyRent)throw new Error('اجاره ماهانه را وارد کنید.');
      if(body.transaction==='MORTGAGE_RENT'&&(!body.deposit||!body.monthlyRent))throw new Error('مبلغ ودیعه و اجاره ماهانه را وارد کنید.');
      await apiRequest<ApiProperty>(editingCode?`/properties/${editingCode}`:'/properties',session,{method:editingCode?'PATCH':'POST',body:JSON.stringify(body)});
      await refreshProperties(session);setForm(emptyDraft);setEditingCode(null);setModal(false);setView('properties');notify(editingCode?'تغییرات فایل ملک ذخیره شد':'فایل ملک با موفقیت ثبت شد');
    }catch(error){notify(error instanceof Error?error.message:'ذخیره فایل ناموفق بود. دوباره تلاش کنید.',true)}finally{setSavingProperty(false)}
  };
  const toggleArchive=async(id:string,archive:boolean)=>{if(!session)return;try{await apiRequest(`/properties/${id}/${archive?'archive':'restore'}`,session,{method:'POST'});await refreshProperties(session);notify(archive?'فایل به بایگانی منتقل شد':'فایل از بایگانی بازگردانده شد')}catch(error){notify(error instanceof Error?error.message:'عملیات انجام نشد',true)}};
  const openNewCustomer=()=>{setEditingCustomer(null);setCustomerModal(true)};
  const saveCustomer=async(draft:CustomerDraft)=>{
    if(!session||savingCustomer)return;setSavingCustomer(true);
    try{
      const toAmount=(value:string)=>asLatin(value.trim()).replace(/[٬,\s]/g,'');
      const body:Record<string,unknown>={fullName:draft.fullName.trim(),phone:asLatin(draft.phone.trim()),email:draft.email.trim()||null,kind:draft.kind,currency:draft.currency,budgetMin:draft.budgetMin.trim()?toAmount(draft.budgetMin):null,budgetMax:draft.budgetMax.trim()?toAmount(draft.budgetMax):null,targetTransaction:draft.targetTransaction||null,preferredPropertyType:draft.preferredPropertyType||null,preferredArea:draft.preferredArea.trim()||null,notes:draft.notes.trim()||null};
      if(editingCustomer)body.status=draft.status;else body.branchId=defaultBranchId;
      if(body.budgetMin&&body.budgetMax&&BigInt(String(body.budgetMin))>BigInt(String(body.budgetMax)))throw new Error('حداقل بودجه نباید از حداکثر بودجه بیشتر باشد.');
      await apiRequest<CustomerRecord>(editingCustomer?`/customers/${editingCustomer.id}`:'/customers',session,{method:editingCustomer?'PATCH':'POST',body:JSON.stringify(body)});
      await refreshCustomers(session);setCustomerModal(false);setEditingCustomer(null);notify(editingCustomer?'اطلاعات مشتری به‌روز شد':'مشتری در سامانه ثبت شد');
    }catch(error){notify(error instanceof Error?error.message:'ذخیره مشتری ناموفق بود.',true)}finally{setSavingCustomer(false)}
  };
  const archiveCustomer=async(customer:CustomerView,archive:boolean)=>{
    if(!session)return;
    try{await apiRequest(`/customers/${customer.id}/${archive?'archive':'restore'}`,session,{method:'POST'});await refreshCustomers(session);notify(archive?'مشتری به بایگانی منتقل شد':'مشتری از بایگانی بازگردانده شد')}
    catch(error){notify(error instanceof Error?error.message:'تغییر وضعیت مشتری ناموفق بود.',true)}
  };
  const createFollowUp=async(draft:FollowUpDraft):Promise<boolean>=>{
    if(!session||savingFollowUp)return false;setSavingFollowUp(true);
    try{
      const dueAt=new Date(draft.dueAt);if(!Number.isFinite(dueAt.getTime()))throw new Error('زمان پیگیری معتبر نیست.');
      const body={branchId:defaultBranchId,customerId:draft.customerId,propertyId:draft.propertyId||undefined,title:draft.title.trim(),kind:draft.kind,dueAt:dueAt.toISOString(),details:draft.details.trim()||undefined};
      await apiRequest<FollowUpRecord>('/follow-ups',session,{method:'POST',body:JSON.stringify(body)});
      await refreshFollowUps(session);notify('پیگیری در برنامه ثبت شد');return true;
    }catch(error){notify(error instanceof Error?error.message:'ثبت پیگیری ناموفق بود.',true);return false}finally{setSavingFollowUp(false)}
  };
  const updateFollowUpStatus=async(item:FollowUpView,action:'complete'|'cancel')=>{
    if(!session)return;
    if(action==='cancel'&&!window.confirm(`پیگیری «${item.title}» لغو شود؟`))return;
    try{await apiRequest(`/follow-ups/${item.id}/${action}`,session,{method:'POST'});await refreshFollowUps(session);notify(action==='complete'?'پیگیری انجام‌شده ثبت شد':'پیگیری لغو شد')}
    catch(error){notify(error instanceof Error?error.message:'تغییر پیگیری ناموفق بود.',true)}
  };
  const exportCsv=(records:Property[])=>{const blob=new Blob([exportPropertiesCsv(records)],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='melkino-properties.csv';anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);notify('خروجی CSV آماده شد')};
  if(!backendConfigured)return <SetupScreen/>;
  if(!authReady)return <NoticeScreen title="در حال آماده‌سازی ملکینو" message="وضعیت ورود بررسی می‌شود…"/>;
  if(!session)return <LoginScreen email={loginEmail} setEmail={setLoginEmail} password={loginPassword} setPassword={setLoginPassword} busy={authBusy} error={authError} onSubmit={signIn}/>;
  return <div className="app-shell" dir="rtl">
    {mobileNav&&<button className="scrim" onClick={()=>setMobileNav(false)} aria-label="بستن منو"/>}
    <aside className={`sidebar ${mobileNav?'sidebar-open':''}`}>
      <div className="brand-row"><div className="brand-banner"><img src="/assets/melkino-logo.png" alt="ملکینو، مدیریت هوشمند املاک"/></div><button className="mobile-close" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace-switch"><div className="workspace-mark">آ</div><div><b>پنل آژانس ملکینو</b><span>مدیریت فایل‌های ملکی</span></div><ChevronDown size={15}/></div>
      <div className="side-scroll">
        {navSections.map(section=><div className="nav-group" key={section.label}><div className="nav-label">{section.label}</div>{section.items.map(([label,Icon]:any)=><button key={label} className={`nav-item ${view===titleToView[label]?'active':''}`} onClick={()=>selectView(titleToView[label])}><Icon size={18} strokeWidth={1.8}/><span>{label}</span>{label==='فایل‌های املاک'&&<small className="nav-count">{fa(properties.filter(property=>property.status!=='بایگانی').length)}</small>}</button>)}</div>)}
        <div className="nav-group"><div className="nav-label">سازمان</div><button className="nav-item" disabled title="این بخش هنوز پیاده‌سازی نشده است"><ShieldCheck size={18}/><span>تیم و دسترسی‌ها</span></button><button className="nav-item" disabled title="این بخش هنوز پیاده‌سازی نشده است"><Settings2 size={18}/><span>تنظیمات آژانس</span></button></div>
      </div>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><div><b>به راهنمایی نیاز دارید؟</b><span>با تیم پشتیبانی صحبت کنید</span></div><ArrowUpLeft size={15}/></div><div className="profile"><div className="avatar avatar-lime">ن</div><div className="profile-text"><b>{session.user.user_metadata?.full_name||session.user.email}</b><span>حساب کاربری</span></div><button className="icon-button profile-more" aria-label="خروج از حساب" title="خروج از حساب" onClick={()=>void signOut()}><LogOut size={17}/></button></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={()=>setMobileNav(true)} aria-label="باز کردن منو"><Menu size={20}/></button><div className="breadcrumb"><span>ملکینو</span><ChevronLeft size={14}/><b>{view==='dashboard'?'نمای کلی':Object.keys(titleToView).find(k=>titleToView[k]===view)}</b></div>
        <div className="top-actions"><span className={`demo-pill ${apiConnection==='connected'?'connected-pill':''}`} title={backendError}>{apiConnection==='checking'?'در حال اتصال…':apiConnection==='connected'?'اتصال API برقرار':'خطا در اتصال API'}</span><button className="global-search" onClick={()=>document.getElementById('global-search')?.focus()}><Search size={17}/><input id="global-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو در ملکینو..."/><kbd><Command size={11}/> K</kbd></button><button className="top-icon" aria-label="راهنما" title="راهنمای استفاده در حال آماده‌سازی است" disabled><CircleHelp size={18}/></button><button className="top-icon" aria-label="همگام‌سازی فایل‌ها" title="همگام‌سازی فایل‌ها" onClick={()=>view==='customers'?void refreshCustomers(session):view==='calendar'?void refreshFollowUps(session):refreshDashboard()}><Activity size={18}/></button><div className="top-divider"/><div className="date-chip"><CalendarDays size={16}/><span>{new Intl.DateTimeFormat('fa-IR',{dateStyle:'full'}).format(new Date())}</span></div></div>
      </header>
      <div className="page-content">
        {view!=='dashboard'&&backendError&&<div className="backend-error" role="alert">{backendError}<button onClick={()=>view==='customers'?void refreshCustomers(session):view==='calendar'?void refreshFollowUps(session):refreshDashboard()}>تلاش دوباره</button></div>}
        {view==='dashboard'?<Dashboard properties={properties} loading={loadingProperties} error={backendError} followUpError={followUpError} followUps={followUps} loadingFollowUps={loadingFollowUps} onRefresh={refreshDashboard} onCompleteFollowUp={item=>void updateFollowUpStatus(item,'complete')} onCreate={openCreate} onView={selectView}/>:view==='customers'?<CustomersPage customers={customers} loading={loadingCustomers} search={query} setSearch={setQuery} onCreate={openNewCustomer} onEdit={customer=>{setEditingCustomer(customer);setCustomerModal(true)}} onArchive={archiveCustomer} onFollowUp={customer=>{setFollowUpCustomerId(customer.id);selectView('calendar')}}/>:view==='calendar'?<FollowUpsPage items={followUps} customers={customers} properties={properties} loading={loadingFollowUps} saving={savingFollowUp} error={followUpError} onRefresh={()=>void refreshFollowUps(session)} presetCustomerId={followUpCustomerId} onPresetConsumed={()=>setFollowUpCustomerId('')} onCreate={createFollowUp} onComplete={item=>void updateFollowUpStatus(item,'complete')} onCancel={item=>void updateFollowUpStatus(item,'cancel')} onCustomers={()=>selectView('customers')}/>:<ModulePage view={view} properties={filtered} allProperties={properties} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} onCreate={openCreate} onEdit={openEdit} onArchive={toggleArchive} onExport={exportCsv} onNotify={notify}/> }
      </div>
    </main>
    {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="property-modal-title" onSubmit={saveProperty}><div className="modal-head"><div><span className="eyebrow">مدیریت فایلینگ</span><h2 id="property-modal-title">{editingCode?`ویرایش فایل ${properties.find(p=>p.id===editingCode)?.code||''}`:'ثبت فایل ملک جدید'}</h2><p>اطلاعات فایل در پایگاه داده آژانس ثبت می‌شود.</p></div><button type="button" className="icon-button" aria-label="بستن فرم ملک" onClick={()=>setModal(false)}><X size={19}/></button></div><div className="form-grid"><label className="field full">عنوان فایل<input autoFocus placeholder="مثلاً آپارتمان نورگیر در زعفرانیه" required maxLength={160} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label className="field full">محدوده و نشانی<input placeholder="محله، خیابان اصلی" required maxLength={500} value={form.area} onChange={e=>setForm({...form,area:e.target.value})}/></label><label className="field">نوع ملک<select required value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="APARTMENT">آپارتمان</option><option value="VILLA">ویلا</option><option value="LAND">زمین</option><option value="COMMERCIAL">تجاری</option><option value="OFFICE">اداری</option><option value="OTHER">سایر</option></select></label><label className="field">نوع معامله<select required value={form.transaction} onChange={e=>setForm({...form,transaction:e.target.value,price:'',deposit:'',monthlyRent:''})}><option value="SALE">فروش</option><option value="RENT">اجاره</option><option value="MORTGAGE_RENT">رهن و اجاره</option><option value="EXCHANGE">معاوضه</option><option value="OTHER">سایر / توافقی</option></select></label><label className="field">متراژ (متر مربع)<input inputMode="decimal" required placeholder="۱۴۰" value={form.size} onChange={e=>setForm({...form,size:e.target.value})}/></label><label className="field">تعداد اتاق<input inputMode="numeric" placeholder="۳" value={form.beds} onChange={e=>setForm({...form,beds:e.target.value})}/></label>{editingCode&&<label className="field">وضعیت فایل<select value={form.status||'ACTIVE'} onChange={e=>setForm({...form,status:e.target.value})}><option value="ACTIVE">فعال</option><option value="UNDER_VISIT">در بازدید</option><option value="NEGOTIATING">در مذاکره</option></select></label>}{['SALE','RENT','MORTGAGE_RENT'].includes(form.transaction||'SALE')&&<label className="field">واحد پول<select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}><option value="IRT">تومان</option><option value="IRR">ریال</option></select></label>}{form.transaction==='SALE'&&<label className="field">قیمت فروش (عدد کامل)<input inputMode="numeric" required placeholder="مثلاً ۱۸۰۰۰۰۰۰۰۰۰" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label>}{form.transaction==='RENT'&&<label className="field">اجاره ماهانه (عدد کامل)<input inputMode="numeric" required value={form.monthlyRent} onChange={e=>setForm({...form,monthlyRent:e.target.value})}/></label>}{form.transaction==='MORTGAGE_RENT'&&<><label className="field">مبلغ ودیعه<input inputMode="numeric" required value={form.deposit} onChange={e=>setForm({...form,deposit:e.target.value})}/></label><label className="field">اجاره ماهانه<input inputMode="numeric" required value={form.monthlyRent} onChange={e=>setForm({...form,monthlyRent:e.target.value})}/></label></>}</div><div className="modal-foot"><button type="button" className="btn-secondary" onClick={()=>setModal(false)}>انصراف</button><button className="btn-primary" disabled={loadingProperties||savingProperty}>{savingProperty?'در حال ذخیره…':<>{editingCode?<Pencil size={16}/>:<Plus size={16}/>} {editingCode?'ذخیره تغییرات':'ثبت فایل ملک'}</>}</button></div></form></div>}
    {customerModal&&<CustomerForm customer={editingCustomer} busy={savingCustomer} onClose={()=>{setCustomerModal(false);setEditingCustomer(null)}} onSave={saveCustomer}/>}
    {toast&&<div className={`toast ${toastIsError?'toast-error':''}`} role={toastIsError?'alert':'status'}><span className="toast-check">{toastIsError?<X size={15}/>:<Check size={15}/>}</span>{toast}</div>}
  </div>
}

function Dashboard({properties,loading,error,followUpError,followUps,loadingFollowUps,onRefresh,onCompleteFollowUp,onCreate,onView}:{properties:Property[];loading:boolean;error:string;followUpError:string;followUps:FollowUpView[];loadingFollowUps:boolean;onRefresh:()=>void;onCompleteFollowUp:(item:FollowUpView)=>void;onCreate:()=>void;onView:(v:string)=>void}){
 const active=properties.filter(p=>p.status==='فعال').length;
 const visits=properties.filter(p=>p.status==='بازدید').length;
 const negotiating=properties.filter(p=>p.status==='در مذاکره').length;
 const upcoming=followUps.filter(item=>item.status==='OPEN').sort((a,b)=>new Date(a.dueAt).getTime()-new Date(b.dueAt).getTime()).slice(0,4);
 return <>
  <div className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> نمای کلی آژانس</div><h1>نمای کلی ملکینو</h1><p>آمار بر اساس فایل‌های ثبت‌شده در پایگاه داده شماست.</p></div><div className="welcome-actions"><button className="btn-secondary" onClick={onRefresh}><Activity size={16}/> همگام‌سازی</button><button className="btn-primary" onClick={onCreate}><Plus size={17}/> ثبت فایل جدید</button></div></div>
  {error&&<div className="backend-error" role="alert">{error}<button onClick={onRefresh}>تلاش دوباره</button></div>}
  <section className="stats-grid"><StatCard icon={Building2} iconTone="green" label="کل فایل‌ها" value={fa(properties.length)}/><StatCard icon={CheckCheck} iconTone="blue" label="فایل‌های فعال" value={fa(active)}/><StatCard icon={Eye} iconTone="orange" label="در بازدید" value={fa(visits)}/><StatCard icon={BriefcaseBusiness} iconTone="purple" label="در مذاکره" value={fa(negotiating)}/></section>
  <section className="panel properties-panel real-dashboard-properties"><div className="panel-head"><div><h2>آخرین فایل‌های ثبت‌شده</h2><p>{loading?'در حال دریافت اطلاعات…':'فایل‌های پایگاه داده آژانس شما'}</p></div><button className="text-link" onClick={()=>onView('properties')}>مدیریت فایل‌ها <ArrowLeft size={15}/></button></div>{properties.length?<div className="table-wrap"><table><thead><tr><th>ملک</th><th>متراژ / اتاق</th><th>قیمت پیشنهادی</th><th>وضعیت</th><th>مشاور</th></tr></thead><tbody>{properties.slice(0,5).map(p=><PropertyRow key={p.id||p.code} property={p} onClick={()=>onView('properties')}/>)}</tbody></table></div>:<div className="empty-state"><Building2 size={30}/><b>{loading?'در حال بارگذاری فایل‌ها':error?'فایل‌ها در دسترس نیستند':'هنوز فایلی ثبت نشده است'}</b><span>{loading||error?'':'برای شروع، اولین فایل آژانس را ثبت کنید.'}</span>{!loading&&!error&&<button className="btn-primary" onClick={onCreate}><Plus size={16}/> ثبت فایل اول</button>}</div>}</section>
  <section className="panel dashboard-followups"><div className="panel-head"><div><h2><CalendarClock size={16}/> پیگیری‌های پیش‌رو</h2><p>نزدیک‌ترین کارهای باز CRM</p></div><button className="text-link" onClick={()=>onView('calendar')}>همه پیگیری‌ها <ArrowLeft size={15}/></button></div>{followUpError?<div className="dashboard-followup-empty followup-error-message"><span>{followUpError}</span><button onClick={onRefresh}>تلاش دوباره</button></div>:upcoming.length?<div className="dashboard-followup-list">{upcoming.map(item=><div className="dashboard-followup-item" key={item.id}><span className={`followup-type-icon followup-${item.kind.toLowerCase()}`}>{item.kind==='CALL'?<Phone size={15}/>:item.kind==='PROPERTY_VISIT'?<MapPin size={15}/>:item.kind==='MEETING'?<Users size={15}/>:<Clock3 size={15}/>}</span><div className="dashboard-followup-copy"><b>{item.title}</b><span>{item.customerName} <i/> {item.kindLabel} <i/> {item.dueLabel}</span></div><button className="complete-followup" onClick={()=>onCompleteFollowUp(item)} aria-label={`تکمیل ${item.title}`} title="ثبت انجام پیگیری"><Check size={15}/><span>انجام شد</span></button></div>)}</div>:<div className="dashboard-followup-empty"><CalendarClock size={22}/><span>{loadingFollowUps?'در حال دریافت پیگیری‌ها…':'پیگیری باز برای نمایش وجود ندارد.'}</span><button onClick={()=>onView('calendar')}>رفتن به تقویم و پیگیری</button></div>}</section>
  <div className="footer-note"><span>ملکینو <i/> اطلاعات از پایگاه داده آژانس بارگذاری می‌شود</span><span>{new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short'}).format(new Date())}</span></div>
 </>
}
function StatCard({icon:Icon,iconTone,label,value}:any){return <div className="stat-card"><div className="stat-top"><span className={`stat-icon ${iconTone}`}><Icon size={19}/></span></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-foot"><span>از داده‌های ثبت‌شده</span></div></div>}
function PropertyRow({property:p,onClick}:any){return <tr onClick={onClick} className="click-row"><td><div className="table-property"><img src="/assets/melkino-app-icon.png" alt=""/><div><b>{p.title}</b><span><MapPin size={12}/>{p.area}</span></div></div></td><td><span className="table-meta"><Ruler size={13}/>{fa(p.size)} متر <i/> <BedDouble size={13}/>{fa(p.beds)} خواب</span></td><td className="price-cell">{p.price}<small>{p.currency||'تومان'}</small></td><td><Status value={p.status}/></td><td><div className="agent-cell"><span className="avatar avatar-small">{p.agent[0]}</span>{p.agent}</div></td></tr>}
function ManagedPropertyRow({property:p,onEdit,onArchive}:{property:Property,onEdit:(p:Property)=>void,onArchive:(code:string,archive:boolean)=>void}){
 const archived=p.status==='بایگانی';
 return <tr className="click-row"><td><div className="table-property"><img src="/assets/melkino-app-icon.png" alt=""/><div><b>{p.title}</b><span><MapPin size={12}/>{p.area}</span></div></div></td><td><span className="table-meta"><Ruler size={13}/>{fa(p.size)} متر <i/> <BedDouble size={13}/>{fa(p.beds)} خواب</span></td><td className="price-cell">{p.price}<small>{p.currency||'تومان'}</small></td><td><Status value={p.status}/></td><td><div className="agent-cell"><span className="avatar avatar-small">{p.agent[0]}</span>{p.agent}</div></td><td>{p.date}</td><td><div className="row-actions"><button type="button" aria-label={`ویرایش ${p.code}`} title="ویرایش فایل" onClick={()=>onEdit(p)}><Pencil size={15}/></button><button type="button" aria-label={archived?`بازگرداندن ${p.code}`:`بایگانی ${p.code}`} title={archived?'بازگرداندن فایل':'انتقال به بایگانی'} onClick={()=>onArchive(p.id||p.code,!archived)}>{archived?<ArchiveRestore size={15}/>:<Archive size={15}/>}</button></div></td></tr>
}
function Status({value}:any){const cls=value==='فعال'?'status-active':value==='بازدید'?'status-tour':value==='بایگانی'?'status-archived':'status-talk';return <span className={`status ${cls}`}><i/>{value}</span>}
function ModulePage({view,properties,allProperties,query,setQuery,filter,setFilter,onCreate,onEdit,onArchive,onExport,onNotify}:any){
 const label=Object.keys(titleToView).find(k=>titleToView[k]===view)||'نمای کلی';
 const info:Record<string,{desc:string;icon:any}>={properties:{desc:'فایل‌های ملکی، اطلاعات قیمت و وضعیت موجودی آژانس را مدیریت کنید.',icon:Building2},customers:{desc:'ارتباط با مشتریان و سرنخ‌های فروش را در یک جا دنبال کنید.',icon:Users},transactions:{desc:'پرونده‌های در جریان و مراحل تبدیل فرصت به معامله را مدیریت کنید.',icon:BriefcaseBusiness},calendar:{desc:'برنامه بازدیدها، جلسات و پیگیری‌های روزانه تیم را ببینید.',icon:CalendarDays},finance:{desc:'نمای کلی دریافتی‌ها، پرداخت‌ها و وضعیت کمیسیون آژانس.',icon:Wallet},reports:{desc:'شاخص‌های عملکرد و گزارش‌های مدیریتی آژانس.',icon:ChartNoAxesCombined},documents:{desc:'قراردادها و اسناد پرونده‌های ملکی را سازمان‌دهی کنید.',icon:FileText}};
 const Icon=info[view]?.icon||Building2;
 if(view==='properties')return <><div className="module-title-row"><div><div className="eyebrow"><span className="live-dot"/> مدیریت فایلینگ</div><h1>{label}</h1><p>{info[view].desc}</p></div><button className="btn-primary" onClick={onCreate}><Plus size={17}/> ثبت فایل جدید</button></div><div className="property-overview"><div><span>کل فایل‌ها</span><b>{fa(allProperties.length)}</b></div><div><span>فایل‌های فعال</span><b>{fa(allProperties.filter((p:Property)=>p.status==='فعال').length)}</b></div><div><span>در بازدید</span><b>{fa(allProperties.filter((p:Property)=>p.status==='بازدید').length)}</b></div><div><span>در مذاکره</span><b>{fa(allProperties.filter((p:Property)=>p.status==='در مذاکره').length)}</b></div></div><div className="panel full-table-panel"><div className="list-toolbar"><div className="list-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو بر اساس عنوان، محله یا کد فایل..."/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option>همه فایل‌ها</option><option>فعال</option><option>بازدید</option><option>در مذاکره</option><option>بایگانی</option></select><button className="filter-btn" onClick={()=>onExport(properties)}><Download size={15}/> خروجی CSV</button></div><div className="table-wrap"><table><thead><tr><th>ملک</th><th>متراژ / اتاق</th><th>قیمت پیشنهادی</th><th>وضعیت</th><th>مشاور</th><th>تاریخ ثبت</th><th/></tr></thead><tbody>{properties.map((p:Property)=><ManagedPropertyRow key={p.id||p.code} property={p} onEdit={onEdit} onArchive={onArchive}/>)}</tbody></table>{properties.length===0&&<div className="empty-state"><Building2 size={30}/><b>فایلی پیدا نشد</b><span>عبارت جستجو یا فیلتر را تغییر دهید.</span></div>}</div><div className="table-pagination"><span>نمایش {fa(properties.length)} فایل</span><div><b>{properties.length?'۱':'۰'}</b></div></div></div></>;
 return <><div className="module-title-row"><div><div className="eyebrow"><span className="live-dot"/> پنل مدیریت آژانس</div><h1>{label}</h1><p>{info[view]?.desc}</p></div></div><div className="module-placeholder-grid"><div className="module-placeholder panel"><span className="module-icon"><Icon size={24}/></span><h2>{label}، یکپارچه در ملکینو</h2><p>این ماژول هنوز پیاده‌سازی نشده است؛ در این صفحه داده نمونه نمایش داده نمی‌شود.</p><div className="placeholder-callout"><Sparkles size={17}/><span>ماژول عملیاتی این بخش هنوز پیاده‌سازی نشده است.</span></div></div><div className="module-side panel"><div className="side-card-head"><span className="stat-icon green"><Activity size={18}/></span><span className="muted-text">وضعیت ماژول</span></div><b className="module-status">در حال توسعه</b><span className="module-sub">این قابلیت هنوز فعال نشده است.</span><div className="mini-divider"/><div className="side-card-head"><span className="stat-icon blue"><ShieldCheck size={18}/></span><span className="muted-text">حریم خصوصی</span></div><b className="module-status small-status">بدون داده نمایشی</b><span className="module-sub">این بخش تا زمان پیاده‌سازی هیچ داده‌ای نمایش نمی‌دهد.</span></div></div><div className="footer-note"><span>ملکینو <i/> سیستم مدیریت هوشمند املاک</span><span>نسخه رابط کاربری اولیه <span className="sync-dot"/></span></div></>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
