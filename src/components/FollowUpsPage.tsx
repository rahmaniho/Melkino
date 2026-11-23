import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Activity, CalendarClock, Check, Circle, Clock3, MapPin, Phone, Plus, UserRound, X } from 'lucide-react';
import { customerTelHref, type CustomerView } from '../domain/customers';
import type { Property } from '../domain/properties';
import type { FollowUpView } from '../domain/follow-ups';

const fa=(value:number)=>new Intl.NumberFormat('fa-IR').format(value);
const options=[['ALL','همه پیگیری‌ها'],['OPEN','در انتظار'],['DONE','انجام‌شده'],['CANCELLED','لغوشده']] as const;

export type FollowUpDraft={customerId:string;propertyId:string;title:string;kind:'CALL'|'MEETING'|'PROPERTY_VISIT'|'REMINDER';dueAt:string;details:string};
export function FollowUpsPage({items,customers,properties,loading,saving,error,onRefresh,presetCustomerId,onPresetConsumed,onCreate,onComplete,onCancel,onCustomers}:{items:FollowUpView[];customers:CustomerView[];properties:Property[];loading:boolean;saving:boolean;error:string;onRefresh:()=>void;presetCustomerId:string;onPresetConsumed:()=>void;onCreate:(draft:FollowUpDraft)=>Promise<boolean>;onComplete:(item:FollowUpView)=>void;onCancel:(item:FollowUpView)=>void;onCustomers:()=>void}){
 const [filter,setFilter]=useState<string>('OPEN');const [formOpen,setFormOpen]=useState(false);const [formCustomerId,setFormCustomerId]=useState('');
 const openForm=()=>{setFormCustomerId('');setFormOpen(true)};
 useEffect(()=>{if(presetCustomerId){setFormCustomerId(presetCustomerId);setFormOpen(true);onPresetConsumed()}},[presetCustomerId,onPresetConsumed]);
 const filtered=useMemo(()=>items.filter(item=>filter==='ALL'||item.status===filter),[items,filter]);
 const open=items.filter(item=>item.status==='OPEN');
 const today=new Date();const dayKey=(date:Date)=>`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
 const dueToday=open.filter(item=>dayKey(new Date(item.dueAt))===dayKey(today)).length;
 const overdue=open.filter(item=>new Date(item.dueAt).getTime()<Date.now()).length;
 return <><div className="module-title-row"><div><div className="eyebrow"><span className="live-dot"/> پیگیری‌های عملیاتی</div><h1>تقویم و پیگیری</h1><p>تماس، جلسه و بازدید را برای مشتریان آژانس زمان‌بندی و ثبت کنید.</p></div><button className="btn-primary" disabled={!customers.length} onClick={openForm}><Plus size={17}/> ثبت پیگیری</button></div>
 <div className="property-overview followup-overview"><div><span>پیگیری‌های باز</span><b>{fa(open.length)}</b></div><div><span>موعد امروز</span><b>{fa(dueToday)}</b></div><div><span>عقب‌افتاده</span><b className={overdue?'overdue-text':''}>{fa(overdue)}</b></div><div><span>مخاطبان در دسترس</span><b>{fa(customers.length)}</b></div></div>
 <section className="panel followup-panel">{error&&<div className="backend-error followup-error-message" role="alert">{error}<button onClick={onRefresh}>تلاش دوباره</button></div>}<div className="list-toolbar"><div className="followup-toolbar-title"><CalendarClock size={17}/><b>برنامه پیگیری</b></div><select value={filter} onChange={event=>setFilter(event.target.value)}>{options.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><button className="filter-btn" onClick={onCustomers}><UserRound size={15}/> دفتر مشتریان</button></div>
 <div className="followup-list">{filtered.map(item=><FollowUpRow key={item.id} item={item} onComplete={()=>onComplete(item)} onCancel={()=>onCancel(item)} onCustomers={onCustomers}/>)}
 {!filtered.length&&<div className="empty-state"><CalendarClock size={30}/><b>{loading?'در حال دریافت پیگیری‌ها…':items.length?'پیگیری‌ای در این فیلتر نیست':'هنوز پیگیری ثبت نشده است'}</b><span>{loading?'':customers.length?'برای برنامه‌ریزی، پیگیری جدید ثبت کنید.':'ابتدا یک مشتری در دفتر مشتریان ثبت کنید.'}</span>{!loading&&(customers.length?<button className="btn-primary" onClick={openForm}><Plus size={15}/> ثبت اولین پیگیری</button>:<button className="btn-primary" onClick={onCustomers}><UserRound size={15}/> رفتن به دفتر مشتریان</button>)}</div>}
 </div><div className="table-pagination"><span>نمایش {fa(filtered.length)} از {fa(items.length)} پیگیری</span><span>زمان نمایش بر اساس منطقه زمانی دستگاه شماست.</span></div></section>
 {formOpen&&<FollowUpForm customers={customers} properties={properties} initialCustomerId={formCustomerId} busy={saving} onClose={()=>{setFormOpen(false);setFormCustomerId('')}} onSave={async draft=>{const saved=await onCreate(draft);if(saved){setFormOpen(false);setFormCustomerId('')}return saved}}/>}
 <div className="footer-note"><span>ملکینو <i/> هر پیگیری به یک مشتری متصل و در API ثبت می‌شود.</span><span>یادآوری خودکار/اعلان هنوز فعال نیست.</span></div>
 </>
}

function FollowUpRow({item,onComplete,onCancel,onCustomers}:{item:FollowUpView;onComplete:()=>void;onCancel:()=>void;onCustomers:()=>void}){
 const open=item.status==='OPEN';const overdue=open&&new Date(item.dueAt).getTime()<Date.now();
 return <article className={`followup-row ${overdue?'followup-overdue':''}`}><div className={`followup-type-icon followup-${item.kind.toLowerCase()}`}>{item.kind==='CALL'?<Phone size={17}/>:item.kind==='PROPERTY_VISIT'?<MapPin size={17}/>:item.kind==='MEETING'?<UserRound size={17}/>:<Clock3 size={17}/>}</div><div className="followup-main"><div className="followup-heading"><h3>{item.title}</h3><span className={`status followup-status followup-status-${item.status.toLowerCase()}`}><i/>{item.statusLabel}</span></div><div className="followup-meta"><span className="followup-date"><Clock3 size={13}/>{item.dueLabel}{overdue&&<b> · عقب‌افتاده</b>}</span><button onClick={onCustomers} className="followup-customer"><UserRound size={13}/>{item.customerName}</button><a className="followup-phone" href={customerTelHref(item.customerPhone)} aria-label={`تماس با ${item.customerName}`}><Phone size={12}/><bdi>{item.customerPhone}</bdi></a>{item.propertyTitle&&<span><MapPin size={12}/>{item.propertyTitle}</span>}</div>{item.details&&<p className="followup-details">{item.details}</p>}</div><div className="followup-actions">{open&&<><button className="complete-followup" title="ثبت انجام پیگیری" aria-label={`تکمیل ${item.title}`} onClick={onComplete}><Check size={15}/><span>انجام شد</span></button><button className="cancel-followup" title="لغو پیگیری" aria-label={`لغو ${item.title}`} onClick={onCancel}><X size={15}/></button></>}</div></article>
}


function defaultLocalDateTime(){
 const date=new Date(Date.now()+60*60*1000);date.setMinutes(Math.ceil(date.getMinutes()/30)*30,0,0);
 const local=new Date(date.getTime()-date.getTimezoneOffset()*60_000);
 return local.toISOString().slice(0,16);
}

function FollowUpForm({customers,properties,initialCustomerId,busy,onClose,onSave}:{customers:CustomerView[];properties:Property[];initialCustomerId:string;busy:boolean;onClose:()=>void;onSave:(draft:FollowUpDraft)=>Promise<boolean>}){
 const [draft,setDraft]=useState<FollowUpDraft>({customerId:customers.some(customer=>customer.id===initialCustomerId&&customer.status!=='ARCHIVED')?initialCustomerId:customers.find(customer=>customer.status!=='ARCHIVED')?.id||'',propertyId:'',title:'',kind:'CALL',dueAt:defaultLocalDateTime(),details:''});
 const change=(key:keyof FollowUpDraft,value:string)=>setDraft(current=>({...current,[key]:value}));
 const submit=(event:FormEvent)=>{event.preventDefault();void onSave(draft)};
 const activeCustomers=customers.filter(customer=>customer.status!=='ARCHIVED');
 const selectedCustomer=activeCustomers.find(customer=>customer.id===draft.customerId);
 const activeProperties=properties.filter(property=>property.status!=='بایگانی'&&property.branchId===selectedCustomer?.branchId);
 return <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose()}}><form className="modal followup-form" role="dialog" aria-modal="true" aria-labelledby="followup-form-title" onSubmit={submit}><div className="modal-head"><div><span className="eyebrow">برنامه‌ریزی ارتباط</span><h2 id="followup-form-title">ثبت پیگیری جدید</h2><p>پیگیری به نام کاربر واردشده ثبت می‌شود.</p></div><button type="button" className="icon-button" disabled={busy} aria-label="بستن فرم" onClick={onClose}><X size={19}/></button></div><div className="form-grid">
 <label className="field full">مشتری<select required value={draft.customerId} onChange={event=>setDraft(current=>({...current,customerId:event.target.value,propertyId:''}))}><option value="">انتخاب مشتری</option>{activeCustomers.map(customer=><option key={customer.id} value={customer.id}>{customer.fullName} — {customer.phone}</option>)}</select></label>
 <label className="field">نوع پیگیری<select value={draft.kind} onChange={event=>change('kind',event.target.value)}><option value="CALL">تماس</option><option value="MEETING">جلسه</option><option value="PROPERTY_VISIT">بازدید ملک</option><option value="REMINDER">یادآوری</option></select></label>
 <label className="field">زمان پیگیری<input type="datetime-local" required value={draft.dueAt} onChange={event=>change('dueAt',event.target.value)}/></label>
 <label className="field full">عنوان<input required maxLength={160} value={draft.title} onChange={event=>change('title',event.target.value)} placeholder="مثلاً هماهنگی بازدید و دریافت بازخورد"/></label>
 <label className="field full">فایل مرتبط (اختیاری)<select value={draft.propertyId} onChange={event=>change('propertyId',event.target.value)}><option value="">بدون فایل مرتبط</option>{activeProperties.map(property=><option key={property.id} value={property.id}>{property.code} — {property.title}</option>)}</select></label>
 <label className="field full">یادداشت<textarea rows={3} maxLength={2000} value={draft.details} onChange={event=>change('details',event.target.value)} placeholder="جزئیات لازم برای پیگیری"/></label>
 </div><div className="modal-foot"><button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>انصراف</button><button className="btn-primary" disabled={busy||!activeCustomers.length}>{busy?'در حال ذخیره…':<><Plus size={16}/> ثبت پیگیری</>}</button></div></form></div>
}
