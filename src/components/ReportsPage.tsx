import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, BriefcaseBusiness, Building2, CalendarClock, CheckCircle2, Download, Users } from 'lucide-react';
import type { CustomerView } from '../domain/customers';
import type { FollowUpView } from '../domain/follow-ups';
import type { Property } from '../domain/properties';
import { calculateCommission, readCommissionRecords, type CommissionRecord, type MoneyCurrency } from '../domain/finance';
import { readTransactionRecords, type TransactionRecord } from '../domain/transactions';

const fa=(value:number|bigint)=>new Intl.NumberFormat('fa-IR').format(value);
const windowOptions=[['30','۳۰ روز گذشته'],['90','۹۰ روز گذشته'],['all','همهٔ زمان‌ها']] as const;
const financeKey=(userId:string)=>`melkino-local-finance-v1:${encodeURIComponent(userId)}`;
const transactionsKey=(userId:string)=>`melkino-local-transactions-v1:${encodeURIComponent(userId)}`;
const propertyTypeLabels:Record<string,string>={آپارتمان:'آپارتمان',ویلا:'ویلا',زمین:'زمین',تجاری:'تجاری',اداری:'اداری',سایر:'سایر'};

export function ReportsPage({userId,properties,customers,followUps,loading,followUpError}:{userId:string;properties:Property[];customers:CustomerView[];followUps:FollowUpView[];loading:boolean;followUpError:string}){
 const [period,setPeriod]=useState<'30'|'90'|'all'>('30');const [commissions,setCommissions]=useState<CommissionRecord[]>([]);const [transactions,setTransactions]=useState<TransactionRecord[]>([]);const [error,setError]=useState('');
 useEffect(()=>{try{setCommissions(readCommissionRecords(window.localStorage,financeKey(userId),userId));setTransactions(readTransactionRecords(window.localStorage,transactionsKey(userId),userId))}catch{setError('دفترهای محلی در دسترس نیستند.')}},[userId]);
 const since=period==='all'?0:Date.now()-Number(period)*24*60*60*1000;
 const inRange=(value:string|undefined|null)=>Boolean(value&&Number.isFinite(new Date(value).getTime())&&new Date(value).getTime()>=since);
 const metrics=useMemo(()=>{
  const newProperties=properties.filter(item=>inRange(item.createdAt)).length;
  const newCustomers=customers.filter(item=>inRange(item.createdAt)).length;
  const completed=followUps.filter(item=>item.status==='DONE'&&inRange(item.completedAt)).length;
  const overdue=followUps.filter(item=>item.status==='OPEN'&&new Date(item.dueAt).getTime()<Date.now()).length;
  const newCommissions=commissions.filter(item=>inRange(item.createdAt));
  const newTransactions=transactions.filter(item=>inRange(item.createdAt)).length;
  const openTransactions=transactions.filter(item=>item.stage!=='CLOSED'&&item.stage!=='CANCELLED').length;
  const closedTransactions=transactions.filter(item=>item.stage==='CLOSED').length;
  const paid={IRT:0n,IRR:0n};const open={IRT:0n,IRR:0n};
  for(const commission of newCommissions){const amount=BigInt(calculateCommission(commission.transactionAmount,commission.commissionRateBasisPoints));(commission.status==='PAID'?paid:open)[commission.currency]+=amount}
  const propertyTypes=Object.entries(properties.reduce<Record<string,number>>((all,item)=>{if(item.status!=='بایگانی')all[item.type]=(all[item.type]||0)+1;return all},{})).sort((a,b)=>b[1]-a[1]);
  const customerStatuses=[['سرنخ جدید',customers.filter(item=>item.status==='NEW').length],['تماس‌گرفته',customers.filter(item=>item.status==='CONTACTED').length],['واجدشرایط',customers.filter(item=>item.status==='QUALIFIED').length],['تبدیل‌شده',customers.filter(item=>item.status==='CLOSED').length]] as [string,number][];
  return {newProperties,newCustomers,completed,overdue,propertyTypes,customerStatuses,paid,open,commissionCount:newCommissions.length,newTransactions,openTransactions,closedTransactions};
 },[properties,customers,followUps,commissions,transactions,period]);
 const exportCsv=()=>{const rows=[['شاخص','مقدار'],['فایل‌های ثبت‌شده در بازه',metrics.newProperties],['مشتریان ثبت‌شده در بازه',metrics.newCustomers],['پیگیری‌های تکمیل‌شده در بازه',metrics.completed],['پیگیری‌های عقب‌افتاده',metrics.overdue],['پرونده‌های معامله ثبت‌شده در بازه',metrics.newTransactions],['پرونده‌های معاملهٔ باز',metrics.openTransactions],['معاملات نهایی‌شده',metrics.closedTransactions],['رکوردهای کمیسیون محلی',metrics.commissionCount],['کمیسیون دریافت‌شده (تومان)',metrics.paid.IRT],['کمیسیون در انتظار (تومان)',metrics.open.IRT],['کمیسیون دریافت‌شده (ریال)',metrics.paid.IRR],['کمیسیون در انتظار (ریال)',metrics.open.IRR]];const cell=(value:string|number|bigint)=>`"${String(value).replace(/"/g,'""')}"`;const csv='\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const anchor=document.createElement('a');anchor.href=url;anchor.download='melkino-local-report.csv';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 return <><div className="module-title-row"><div><div className="eyebrow"><span className="live-dot"/> گزارش‌های داده‌محور</div><h1>گزارش‌ها</h1><p>شاخص‌ها از داده‌های قابل‌دسترسی برنامه محاسبه می‌شوند؛ گزارش مالی فقط شامل دفتر محلی همین مرورگر است.</p></div><button className="filter-btn" onClick={exportCsv}><Download size={15}/> خروجی CSV</button></div>
 <div className="report-toolbar"><div><BarChart3 size={17}/><b>بازهٔ گزارش</b>{loading&&<small className="report-loading">در حال همگام‌سازی داده‌ها…</small>}</div><div className="report-period-tabs" role="group" aria-label="انتخاب بازهٔ گزارش">{windowOptions.map(([value,label])=><button type="button" key={value} className={period===value?'active':''} aria-pressed={period===value} onClick={()=>setPeriod(value)}>{label}</button>)}</div></div>
 {error&&<div className="backend-error" role="alert">{error}</div>}{followUpError&&<div className="backend-error" role="alert">{followUpError}</div>}
 <section className="report-stat-grid"><ReportStat icon={Building2} label="فایل جدید در بازه" value={fa(metrics.newProperties)} note={`از ${fa(properties.length)} فایل قابل‌دسترسی`}/><ReportStat icon={Users} label="مشتری جدید در بازه" value={fa(metrics.newCustomers)} note={`از ${fa(customers.length)} مخاطب قابل‌دسترسی`}/><ReportStat icon={BriefcaseBusiness} label="معاملهٔ جدید در بازه" value={fa(metrics.newTransactions)} note={`${fa(metrics.openTransactions)} پروندهٔ معامله باز`}/><ReportStat icon={CheckCircle2} label="پیگیری تکمیل‌شده" value={fa(metrics.completed)} note={`${fa(metrics.overdue)} پیگیری بازِ عقب‌افتاده`}/><ReportStat icon={Activity} label="پرونده کمیسیون محلی" value={fa(metrics.commissionCount)} note="ذخیره‌شده در مرورگر جاری"/></section>
 <div className="report-panels"><section className="panel report-panel"><div className="panel-head"><div><h2><Building2 size={16}/> ترکیب فایل‌های فعال</h2><p>توزیع بر اساس نوع ملک، بدون فایل بایگانی</p></div><b className="report-total">{fa(properties.filter(item=>item.status!=='بایگانی').length)} فایل</b></div>{metrics.propertyTypes.length?metrics.propertyTypes.map(([type,count])=><ProgressRow key={type} label={propertyTypeLabels[type]||type} value={count} maximum={Math.max(...metrics.propertyTypes.map(item=>item[1]))}/>):<div className="report-empty">دادهٔ فایل برای گزارش موجود نیست.</div>}</section>
 <section className="panel report-panel"><div className="panel-head"><div><h2><Users size={16}/> وضعیت سرنخ‌های CRM</h2><p>توزیع وضعیت بین مخاطبان بارگذاری‌شده</p></div><b className="report-total">{fa(customers.length)} نفر</b></div>{metrics.customerStatuses.map(([label,count])=><ProgressRow key={label} label={label} value={count} maximum={Math.max(1,...metrics.customerStatuses.map(item=>item[1]))}/>)}<div className="report-source-note">«تبدیل‌شده» براساس وضعیت ثبت‌شدهٔ مشتری است؛ نرخ تبدیل به معامله محاسبه نمی‌شود.</div></section></div>
 <section className="report-finance panel"><div className="panel-head"><div><h2><CalendarClock size={16}/> خلاصهٔ کمیسیون محلی</h2><p>رکوردهای ایجادشده در بازهٔ انتخابی</p></div><span className="local-only-chip">فقط مرورگر</span></div><div className="report-finance-grid"><FinanceSummary currency="IRT" paid={metrics.paid.IRT} open={metrics.open.IRT}/><FinanceSummary currency="IRR" paid={metrics.paid.IRR} open={metrics.open.IRR}/></div><div className="report-source-note">مبالغ از رکوردهای محلی محاسبه شده‌اند؛ این گزارش صورت‌حساب رسمی نیست و با API همگام نمی‌شود.</div></section>
 <div className="footer-note"><span>ملکینو <i/> ارقام از اطلاعات فعلی قابل‌دسترسی محاسبه شده‌اند</span><span>بازه: {windowOptions.find(([value])=>value===period)?.[1]}</span></div></>
}
function ReportStat({icon:Icon,label,value,note}:{icon:typeof Building2;label:string;value:string;note:string}){return <div className="report-stat-card"><span className="report-stat-icon"><Icon size={18}/></span><small>{label}</small><b>{value}</b><span>{note}</span></div>}
function ProgressRow({label,value,maximum}:{label:string;value:number;maximum:number}){return <div className="report-progress-row"><div><span>{label}</span><b>{fa(value)}</b></div><i><span style={{width:`${maximum?Math.round(value/maximum*100):0}%`}}/></i></div>}
function FinanceSummary({currency,paid,open}:{currency:MoneyCurrency;paid:bigint;open:bigint}){const unit=currency==='IRT'?'تومان':'ریال';return <div className="report-finance-unit"><b>{unit}</b><span>دریافت‌شده <strong>{fa(paid)}</strong></span><span>در انتظار <strong>{fa(open)}</strong></span></div>}
