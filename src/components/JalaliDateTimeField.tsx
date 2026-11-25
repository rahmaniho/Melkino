import { useMemo } from 'react';
import { currentJalaliYear, formatJalaliDate, getJalaliDateParts, getJalaliDateValue, getJalaliYearData } from '../domain/jalali-calendar';

const fa=(value:number)=>new Intl.NumberFormat('fa-IR').format(value);

export function JalaliDateTimeField({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const selectedDate=new Date(value);
 const safeDate=Number.isNaN(selectedDate.getTime())?new Date():selectedDate;
 const selected=getJalaliDateParts(safeDate);
 const yearData=useMemo(()=>getJalaliYearData(selected.year),[selected.year]);
 const monthData=yearData.months.find(month=>month.month===selected.month)||yearData.months[0];
 const years=useMemo(()=>{const current=currentJalaliYear();return Array.from({length:7},(_,index)=>current-1+index)},[]);
 const time=`${String(safeDate.getHours()).padStart(2,'0')}:${String(safeDate.getMinutes()).padStart(2,'0')}`;
 const setDate=(year:number,month:number,day:number)=>{const days=getJalaliYearData(year).months.find(item=>item.month===month)?.days||[];const clamped=Math.min(day,days.length);if(!clamped)return;onChange(getJalaliDateValue(year,month,clamped,time))};
 const setTime=(nextTime:string)=>onChange(getJalaliDateValue(selected.year,selected.month,selected.day,nextTime));
 return <div className="field full jalali-date-field"><span className="jalali-date-label">تاریخ و ساعت پیگیری</span><div className="jalali-date-display" aria-live="polite">{formatJalaliDate(safeDate)} <span>·</span> {time}</div><div className="jalali-date-columns" aria-label="انتخاب تاریخ شمسی"><label>روز<select aria-label="روز شمسی" required value={selected.day} onChange={event=>setDate(selected.year,selected.month,Number(event.target.value))}>{monthData.days.map(day=><option key={day.day} value={day.day}>{fa(day.day)}</option>)}</select></label><label>ماه<select aria-label="ماه شمسی" required value={selected.month} onChange={event=>setDate(selected.year,Number(event.target.value),selected.day)}>{yearData.months.map(month=><option key={month.month} value={month.month}>{month.name}</option>)}</select></label><label>سال<select aria-label="سال شمسی" required value={selected.year} onChange={event=>setDate(Number(event.target.value),selected.month,selected.day)}>{years.map(year=><option key={year} value={year}>{fa(year)}</option>)}</select></label><label className="jalali-time-column">ساعت<input aria-label="ساعت پیگیری" type="time" required value={time} onChange={event=>setTime(event.target.value)}/></label></div><div className="jalali-date-hint"><small>تاریخ شمسی را از ستون‌های روز، ماه و سال انتخاب کنید.</small><button type="button" onClick={()=>{const today=getJalaliDateParts(new Date());setDate(today.year,today.month,today.day)}}>انتخاب امروز</button></div></div>
}
