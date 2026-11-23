export type CustomerKind = 'BUYER' | 'SELLER' | 'TENANT' | 'LANDLORD' | 'OTHER';
export type CustomerStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED' | 'ARCHIVED';
export type CustomerRecord = {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  email: string | null;
  kind: CustomerKind;
  targetTransaction: 'SALE' | 'RENT' | 'MORTGAGE_RENT' | 'EXCHANGE' | 'OTHER' | null;
  preferredPropertyType: 'APARTMENT' | 'VILLA' | 'LAND' | 'COMMERCIAL' | 'OFFICE' | 'OTHER' | null;
  budgetMin: string | null;
  budgetMax: string | null;
  currency: 'IRR' | 'IRT';
  preferredArea: string | null;
  notes: string | null;
  status: CustomerStatus;
  assignedTo: string;
  createdAt: string;
  archivedAt: string | null;
};
export type CustomerDraft = {
  fullName: string;
  phone: string;
  email: string;
  kind: CustomerKind;
  targetTransaction: string;
  preferredPropertyType: string;
  budgetMin: string;
  budgetMax: string;
  currency: 'IRR' | 'IRT';
  preferredArea: string;
  notes: string;
  status: Exclude<CustomerStatus, 'ARCHIVED'>;
};
export type CustomerView = CustomerRecord & { kindLabel: string; statusLabel: string; budgetLabel: string; assignedLabel: string; createdLabel: string };

export function customerTelHref(phone:string):string{
  const latin=phone.replace(/[۰-۹٠-٩]/g,d=>String(d>='۰'&&d<='۹'?d.charCodeAt(0)-'۰'.charCodeAt(0):d.charCodeAt(0)-'٠'.charCodeAt(0)));
  const compact=latin.replace(/[^+\d]/g,'');
  return `tel:${compact.startsWith('+')?'+':''}${compact.replace(/\+/g,'')}`;
}

export function mapCustomer(record: CustomerRecord, currentUserId?: string, currentUserName?: string): CustomerView {
  const format = (value: string | null) => value === null ? '' : new Intl.NumberFormat('fa-IR').format(BigInt(value));
  const currencyName = record.currency === 'IRT' ? 'تومان' : 'ریال';
  const min = format(record.budgetMin); const max = format(record.budgetMax);
  const budgetLabel = min || max ? `${min || '—'} تا ${max || '—'} ${currencyName}` : 'تعیین نشده';
  const kindLabels: Record<CustomerKind, string> = { BUYER: 'خریدار', SELLER: 'فروشنده', TENANT: 'مستأجر', LANDLORD: 'موجر', OTHER: 'سایر' };
  const statusLabels: Record<CustomerStatus, string> = { NEW: 'سرنخ جدید', CONTACTED: 'تماس گرفته‌شده', QUALIFIED: 'مشتری واجدشرایط', CLOSED: 'تبدیل‌شده', ARCHIVED: 'بایگانی' };
  return {
    ...record,
    kindLabel: kindLabels[record.kind],
    statusLabel: statusLabels[record.status],
    budgetLabel,
    assignedLabel: record.assignedTo === currentUserId ? currentUserName || 'کاربر جاری' : 'مشاور تیم',
    createdLabel: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short' }).format(new Date(record.createdAt)),
  };
}

export function exportCustomersCsv(records: CustomerView[]): string {
  const cell = (value: string | number) => {
    const text = String(value);
    const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const rows = [
    ['کد مشتری', 'نام', 'تلفن', 'ایمیل', 'نوع مشتری', 'بودجه', 'محدوده', 'وضعیت', 'مشاور'],
    ...records.map((record) => [record.code, record.fullName, record.phone, record.email ?? '', record.kindLabel, record.budgetLabel, record.preferredArea ?? '', record.statusLabel, record.assignedLabel]),
  ];
  return `\uFEFF${rows.map((row) => row.map(cell).join(',')).join('\r\n')}`;
}
