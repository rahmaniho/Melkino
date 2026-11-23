import type { FormEvent } from 'react';
import { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import type { CustomerDraft, CustomerView } from '../domain/customers';

export const emptyCustomerDraft: CustomerDraft = {
  fullName: '', phone: '', email: '', kind: 'BUYER', targetTransaction: 'SALE',
  preferredPropertyType: 'APARTMENT', budgetMin: '', budgetMax: '', currency: 'IRT',
  preferredArea: '', notes: '', status: 'NEW',
};

export function CustomerForm({customer,onClose,onSave,busy}:{customer:CustomerView|null;onClose:()=>void;onSave:(draft:CustomerDraft)=>Promise<void>;busy:boolean}){
 const [draft,setDraft]=useState<CustomerDraft>(customer?{
   fullName:customer.fullName,phone:customer.phone,email:customer.email??'',kind:customer.kind,
   targetTransaction:customer.targetTransaction??'',preferredPropertyType:customer.preferredPropertyType??'',
   budgetMin:customer.budgetMin??'',budgetMax:customer.budgetMax??'',currency:customer.currency,
   preferredArea:customer.preferredArea??'',notes:customer.notes??'',status:customer.status==='ARCHIVED'?'NEW':customer.status,
 }:emptyCustomerDraft);
 const change=(key:keyof CustomerDraft,value:string)=>setDraft(current=>({...current,[key]:value}));
 const submit=(event:FormEvent)=>{event.preventDefault();void onSave(draft)};
 return <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose()}}><form className="modal customer-modal" role="dialog" aria-modal="true" aria-labelledby="customer-modal-title" onSubmit={submit}><div className="modal-head"><div><span className="eyebrow">مدیریت ارتباط با مشتری</span><h2 id="customer-modal-title">{customer?`ویرایش ${customer.fullName}`:'ثبت مشتری یا سرنخ جدید'}</h2><p>اطلاعات با دسترسی محدود آژانس در سرور ذخیره می‌شود.</p></div><button type="button" className="icon-button" aria-label="بستن فرم" disabled={busy} onClick={onClose}><X size={19}/></button></div><div className="form-grid customer-form-grid">
 <label className="field">نام و نام خانوادگی<input autoFocus required maxLength={160} value={draft.fullName} onChange={event=>change('fullName',event.target.value)} placeholder="نام کامل"/></label>
 <label className="field">شماره تماس<input dir="ltr" inputMode="tel" autoComplete="tel" required value={draft.phone} onChange={event=>change('phone',event.target.value)} placeholder="۰۹۱۲۱۲۳۴۵۶۷"/></label>
 <label className="field">ایمیل (اختیاری)<input dir="ltr" type="email" autoComplete="email" value={draft.email} onChange={event=>change('email',event.target.value)} placeholder="name@example.com"/></label>
 <label className="field">نوع مشتری<select value={draft.kind} onChange={event=>change('kind',event.target.value)}><option value="BUYER">خریدار</option><option value="SELLER">فروشنده</option><option value="TENANT">مستأجر</option><option value="LANDLORD">موجر</option><option value="OTHER">سایر</option></select></label>
 <label className="field">نوع معامله<select value={draft.targetTransaction} onChange={event=>change('targetTransaction',event.target.value)}><option value="">مشخص نشده</option><option value="SALE">خرید / فروش</option><option value="RENT">اجاره</option><option value="MORTGAGE_RENT">رهن و اجاره</option><option value="EXCHANGE">معاوضه</option><option value="OTHER">سایر</option></select></label>
 <label className="field">نوع ملک موردنظر<select value={draft.preferredPropertyType} onChange={event=>change('preferredPropertyType',event.target.value)}><option value="">مشخص نشده</option><option value="APARTMENT">آپارتمان</option><option value="VILLA">ویلا</option><option value="LAND">زمین</option><option value="COMMERCIAL">تجاری</option><option value="OFFICE">اداری</option><option value="OTHER">سایر</option></select></label>
 <label className="field">حداقل بودجه<input inputMode="numeric" value={draft.budgetMin} onChange={event=>change('budgetMin',event.target.value)} placeholder="عدد کامل"/></label>
 <label className="field">حداکثر بودجه<input inputMode="numeric" value={draft.budgetMax} onChange={event=>change('budgetMax',event.target.value)} placeholder="عدد کامل"/></label>
 <label className="field">واحد بودجه<select value={draft.currency} onChange={event=>change('currency',event.target.value)}><option value="IRT">تومان</option><option value="IRR">ریال</option></select></label>
 <label className="field">محدودهٔ موردنظر<input maxLength={240} value={draft.preferredArea} onChange={event=>change('preferredArea',event.target.value)} placeholder="محله یا منطقه"/></label>
 {customer&&<label className="field">مرحله پیگیری<select value={draft.status} onChange={event=>change('status',event.target.value)}><option value="NEW">سرنخ جدید</option><option value="CONTACTED">تماس گرفته‌شده</option><option value="QUALIFIED">مشتری واجدشرایط</option><option value="CLOSED">تبدیل‌شده</option></select></label>}
 <label className="field full">یادداشت<textarea rows={3} maxLength={2000} value={draft.notes} onChange={event=>change('notes',event.target.value)} placeholder="نیازمندی‌ها یا یادداشت پیگیری (اختیاری)"/></label>
 </div><div className="modal-foot"><button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>انصراف</button><button className="btn-primary" disabled={busy}>{busy?'در حال ذخیره…':customer?<><Save size={16}/> ذخیره تغییرات</>:<><Plus size={16}/> ثبت مشتری</>}</button></div></form></div>
}
