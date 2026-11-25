export type JalaliDateParts = { year: number; month: number; day: number };
export type JalaliDayOption = { day: number; date: string };
export type JalaliMonthOption = { month: number; name: string; days: JalaliDayOption[] };
export type JalaliYearData = { year: number; months: JalaliMonthOption[] };

const numberFormatter = new Intl.NumberFormat('fa-IR', { useGrouping: false });
const partsFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
  year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC',
});
const monthFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long', timeZone: 'UTC' });
const weekdayFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long' });
const yearCache = new Map<number, JalaliYearData>();

function partsInTimeZone(date: Date, formatter: Intl.DateTimeFormat): Record<string, string> {
  return Object.fromEntries(formatter.formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

export function getJalaliDateParts(date: Date): JalaliDateParts {
  const parts = partsInTimeZone(date, new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
    year: 'numeric', month: 'numeric', day: 'numeric',
  }));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

function isoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function getJalaliYearData(year: number): JalaliYearData {
  const cached = yearCache.get(year);
  if (cached) return cached;
  const months = new Map<number, JalaliMonthOption>();
  // A Persian year always lies between March of Gregorian year y+621 and April of y+622.
  const start = Date.UTC(year + 621, 2, 1);
  const end = Date.UTC(year + 622, 3, 11);
  for (let timestamp = start; timestamp < end; timestamp += 86_400_000) {
    const date = new Date(timestamp);
    const parts = partsInTimeZone(date, partsFormatter);
    if (Number(parts.year) !== year) continue;
    const monthNumber = Number(parts.month);
    const day = Number(parts.day);
    let month = months.get(monthNumber);
    if (!month) {
      month = { month: monthNumber, name: monthFormatter.format(date), days: [] };
      months.set(monthNumber, month);
    }
    month.days.push({ day, date: isoDate(date) });
  }
  const result = { year, months: [...months.values()].sort((a, b) => a.month - b.month) };
  if (result.months.length !== 12 || result.months.some((month) => month.days.length < 29 || month.days.length > 31)) {
    throw new Error(`تقویم جلالی سال ${year} در این مرورگر قابل محاسبه نیست.`);
  }
  yearCache.set(year, result);
  return result;
}

export function getJalaliDateValue(year: number, month: number, day: number, time: string): string {
  const selected = getJalaliYearData(year).months.find((item) => item.month === month)?.days.find((item) => item.day === day);
  if (!selected) throw new Error('تاریخ انتخاب‌شده در تقویم پیدا نشد.');
  return `${selected.date}T${time}`;
}

export function formatJalaliDate(date: Date, now = new Date()): string {
  const parts = getJalaliDateParts(date);
  const month = getJalaliYearData(parts.year).months.find((item) => item.month === parts.month)?.name || '';
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  const dateText = `${numberFormatter.format(parts.day)} ${month} ${numberFormatter.format(parts.year)}`;
  if (sameDay) return `امروز، ${dateText}`;
  return `${weekdayFormatter.format(date)}، ${dateText}`;
}

export function currentJalaliYear(now = new Date()): number {
  return getJalaliDateParts(now).year;
}
