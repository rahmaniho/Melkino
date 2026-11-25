export type PropertyStatus = 'فعال' | 'بازدید' | 'در مذاکره' | 'بایگانی' | string;
export type Property = {
  code: string;
  title: string;
  area: string;
  type: string;
  size: number;
  beds: number;
  price: string;
  image: string;
  status: PropertyStatus;
  archivedFromStatus?: string;
  agent: string;
  date: string;
  id?: string;
  branchId?: string;
  currency?: string;
  transaction?: string;
  salePrice?: string | null;
  deposit?: string | null;
  monthlyRent?: string | null;
  apiStatus?: string;
  createdAt?: string;
};
export type PropertyDraft = {
  title: string;
  area: string;
  size: string;
  beds: string;
  price: string;
  type?: string;
  transaction?: string;
  currency?: string;
  deposit?: string;
  monthlyRent?: string;
  status?: string;
};
export const PROPERTY_STORAGE_KEY = 'melkino-properties';

export const initialProperties: Property[] = [
  {code:'ML-2481',title:'آپارتمان مدرن در زعفرانیه',area:'زعفرانیه، خیابان آصف',type:'آپارتمان',size:185,beds:3,price:'۲۸٫۵ میلیارد',image:'photo-1600607687939-ce8a6c25118c',status:'فعال',agent:'نگار محمدی',date:'امروز'},
  {code:'ML-2478',title:'پنت‌هاوس نورگیر نیاوران',area:'نیاوران، منظریه',type:'پنت‌هاوس',size:240,beds:4,price:'۴۲ میلیارد',image:'photo-1600607687920-4e2a09cf159d',status:'بازدید',agent:'آرمان رضایی',date:'دیروز'},
  {code:'ML-2473',title:'واحد دنج و خوش‌نقشه',area:'سعادت‌آباد، بلوار ۲۴ متری',type:'آپارتمان',size:125,beds:2,price:'۱۷٫۸ میلیارد',image:'photo-1600566753086-00f18fb6b3ea',status:'در مذاکره',agent:'سارا کریمی',date:'۲ روز پیش'},
  {code:'ML-2469',title:'ویلای باغی با استخر',area:'لواسان، کلاک',type:'ویلا',size:420,beds:5,price:'۶۸ میلیارد',image:'photo-1600585154340-be6161a56a0c',status:'فعال',agent:'پارسا نوری',date:'۳ روز پیش'},
];

function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) >= 0 ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) : '٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}
function parseNumeric(value: string): number {
  const normalized = toLatinDigits(value.trim()).replace(/[٬,\s]/g, '').replace(/[٫٬]/g, '.');
  return normalized ? Number(normalized) : Number.NaN;
}
function isProperty(value: unknown): value is Property {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Property>;
  return typeof item.code === 'string' && typeof item.title === 'string' && typeof item.area === 'string'
    && typeof item.size === 'number' && typeof item.beds === 'number' && typeof item.price === 'string'
    && typeof item.status === 'string' && typeof item.agent === 'string';
}

export function readProperties(storage: Pick<Storage, 'getItem'>, fallback: Property[] = initialProperties): Property[] {
  try {
    const raw = storage.getItem(PROPERTY_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every(isProperty) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
export function writeProperties(storage: Pick<Storage, 'setItem'>, properties: Property[]): void {
  storage.setItem(PROPERTY_STORAGE_KEY, JSON.stringify(properties));
}

export function normalizePropertyDraft(draft: PropertyDraft): Pick<Property, 'title' | 'area' | 'size' | 'beds' | 'price'> {
  const title = draft.title.trim();
  const area = draft.area.trim();
  if (!title || title.length > 120) throw new Error('عنوان ملک را وارد کنید (حداکثر ۱۲۰ نویسه).');
  if (!area || area.length > 240) throw new Error('محدوده و نشانی را وارد کنید (حداکثر ۲۴۰ نویسه).');
  const size = parseNumeric(draft.size);
  if (!Number.isInteger(size) || size <= 0 || size > 100_000) throw new Error('متراژ باید عدد صحیح بیشتر از صفر باشد.');
  const beds = draft.beds.trim() ? parseNumeric(draft.beds) : 0;
  if (!Number.isInteger(beds) || beds < 0 || beds > 30) throw new Error('تعداد اتاق معتبر نیست.');
  const price = parseNumeric(draft.price);
  if (!Number.isFinite(price) || price <= 0 || price > 1_000_000_000) throw new Error('قیمت باید عددی بیشتر از صفر باشد.');
  return { title, area, size, beds, price: `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(price)} میلیارد` };
}

export function createProperty(draft: PropertyDraft, existing: Property[], now = new Date()): Property {
  const normalized = normalizePropertyDraft(draft);
  const nextCode = Math.max(2480, ...existing.map((property) => Number(property.code.match(/\d+$/)?.[0] ?? 0))) + 1;
  return {
    ...normalized, code: `ML-${nextCode}`, type: 'آپارتمان',
    image: 'photo-1600607687939-ce8a6c25118c', status: 'فعال', agent: 'نگار محمدی',
    date: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short' }).format(now),
  };
}

export function updateProperty(properties: Property[], code: string, changes: Partial<Property>): Property[] {
  if (!properties.some((property) => property.code === code)) throw new Error('فایل ملک پیدا نشد.');
  return properties.map((property) => property.code === code
    ? { ...property, ...changes, code: property.code }
    : property);
}
export function archiveProperty(properties: Property[], code: string, archive: boolean): Property[] {
  const target = properties.find((property) => property.code === code);
  if (!target) throw new Error('فایل ملک پیدا نشد.');
  if (archive && target.status !== 'بایگانی') {
    return updateProperty(properties, code, { archivedFromStatus: target.status, status: 'بایگانی' });
  }
  if (!archive && target.status === 'بایگانی') {
    const { archivedFromStatus = 'فعال', ...rest } = target;
    return properties.map((property) => property.code === code ? { ...rest, status: archivedFromStatus } : property);
  }
  return properties;
}

function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function exportPropertiesCsv(properties: Property[]): string {
  const rows = [
    ['کد فایل', 'عنوان ملک', 'محدوده', 'متراژ', 'اتاق', 'قیمت پیشنهادی', 'واحد پول', 'وضعیت', 'مشاور'],
    ...properties.map((property) => [property.code, property.title, property.area, property.size, property.beds, property.price, property.currency ?? '', property.status, property.agent]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
}
