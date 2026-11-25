import { describe, expect, it } from 'vitest';
import { formatJalaliDate, getJalaliDateParts, getJalaliDateValue, getJalaliYearData } from './jalali-calendar';

describe('Persian calendar date selection',()=>{
 it('formats the requested example as the third of Azar 1405',()=>{const date=new Date(2026,10,24,12,0);expect(getJalaliDateParts(date)).toEqual({year:1405,month:9,day:3});expect(formatJalaliDate(date,new Date(2026,10,24,8,0))).toBe('امروز، ۳ آذر ۱۴۰۵')});
 it('creates a local datetime value from a selectable Jalali day',()=>{expect(getJalaliDateValue(1405,9,3,'09:30')).toBe('2026-11-24T09:30')});
 it('provides all twelve months and valid final days for each month',()=>{const year=getJalaliYearData(1405);expect(year.months).toHaveLength(12);expect(year.months[0].name).toBe('فروردین');expect(year.months[5].days).toHaveLength(31);expect(year.months[11].days.length).toBeGreaterThanOrEqual(29)});
 it('formats a non-current selection with a Persian weekday and date',()=>{expect(formatJalaliDate(new Date(2026,10,24,12),new Date(2026,10,23,12))).toContain('سه‌شنبه، ۳ آذر ۱۴۰۵')});
});
