import type { Property } from './properties';
import type { CustomerRecord, CustomerView } from './customers';
import type { FollowUpRecord } from './follow-ups';
import { mapProperty, type ApiProperty, type PropertyWrite } from '../lib/backend';

export const LOCAL_USER_ID = 'melkino-local-browser';
export const LOCAL_BRANCH_ID = 'melkino-local-branch';
export const LOCAL_USER_NAME = 'کاربر محلی';
export const LOCAL_PROPERTY_KEY = 'melkino-local-properties-v1';
export const LOCAL_CUSTOMER_KEY = 'melkino-local-customers-v1';
export const LOCAL_FOLLOW_UP_KEY = 'melkino-local-follow-ups-v1';

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;

function readArray<T>(storage: ReadableStorage, key: string, isRecord: (value: unknown) => value is T): T[] {
  const raw = storage.getItem(key);
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  return Array.isArray(value) ? value.filter(isRecord) : [];
}
function writeArray<T>(storage: WritableStorage, key: string, records: T[]): void {
  storage.setItem(key, JSON.stringify(records));
}
function isProperty(value: unknown): value is Property {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Property>;
  return typeof item.id === 'string' && typeof item.code === 'string' && typeof item.title === 'string'
    && typeof item.area === 'string' && typeof item.type === 'string' && typeof item.size === 'number'
    && Number.isFinite(item.size) && typeof item.beds === 'number' && typeof item.price === 'string'
    && typeof item.status === 'string' && typeof item.agent === 'string';
}
function isCustomer(value: unknown): value is CustomerRecord {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CustomerRecord>;
  return typeof item.id === 'string' && typeof item.branchId === 'string' && typeof item.code === 'string'
    && typeof item.fullName === 'string' && typeof item.phone === 'string'
    && ['BUYER', 'SELLER', 'TENANT', 'LANDLORD', 'OTHER'].includes(String(item.kind))
    && ['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'ARCHIVED'].includes(String(item.status))
    && ['IRR', 'IRT'].includes(String(item.currency)) && typeof item.assignedTo === 'string'
    && typeof item.createdAt === 'string';
}
function isFollowUp(value: unknown): value is FollowUpRecord {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<FollowUpRecord>;
  return typeof item.id === 'string' && typeof item.code === 'string' && typeof item.title === 'string'
    && ['CALL', 'MEETING', 'PROPERTY_VISIT', 'REMINDER'].includes(String(item.kind))
    && ['OPEN', 'DONE', 'CANCELLED'].includes(String(item.status)) && typeof item.dueAt === 'string'
    && typeof item.customerId === 'string' && typeof item.customerName === 'string'
    && typeof item.assignedTo === 'string' && typeof item.createdAt === 'string';
}

export function readLocalProperties(storage: ReadableStorage): Property[] {
  return readArray(storage, LOCAL_PROPERTY_KEY, isProperty);
}
export function writeLocalProperties(storage: WritableStorage, records: Property[]): void {
  writeArray(storage, LOCAL_PROPERTY_KEY, records);
}
export function readLocalCustomers(storage: ReadableStorage): CustomerRecord[] {
  return readArray(storage, LOCAL_CUSTOMER_KEY, isCustomer);
}
export function writeLocalCustomers(storage: WritableStorage, records: CustomerRecord[]): void {
  writeArray(storage, LOCAL_CUSTOMER_KEY, records);
}
export function readLocalFollowUps(storage: ReadableStorage): FollowUpRecord[] {
  return readArray(storage, LOCAL_FOLLOW_UP_KEY, isFollowUp);
}
export function writeLocalFollowUps(storage: WritableStorage, records: FollowUpRecord[]): void {
  writeArray(storage, LOCAL_FOLLOW_UP_KEY, records);
}

export function makeLocalId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function makeLocalProperty(body: PropertyWrite, existing: Property[], now = new Date()): Property {
  const amount = (value: string | null | undefined) => value && /^\d+$/.test(value) ? new Intl.NumberFormat('fa-IR').format(BigInt(value)) : '';
  const price = body.transaction === 'SALE' ? amount(body.salePrice)
    : body.transaction === 'RENT' ? `${amount(body.monthlyRent)} / ماه`
      : body.transaction === 'MORTGAGE_RENT' ? `ودیعه ${amount(body.deposit)} · اجاره ${amount(body.monthlyRent)} / ماه`
        : 'توافقی';
  const types: Record<PropertyWrite['type'], string> = { APARTMENT: 'آپارتمان', VILLA: 'ویلا', LAND: 'زمین', COMMERCIAL: 'تجاری', OFFICE: 'اداری', OTHER: 'سایر' };
  const status = body.status === 'UNDER_VISIT' ? 'بازدید' : body.status === 'NEGOTIATING' ? 'در مذاکره' : body.status === 'ARCHIVED' ? 'بایگانی' : 'فعال';
  const highestCode = Math.max(0, ...existing.map((property) => Number(property.code.match(/\d+$/)?.[0] ?? 0)));
  const row: ApiProperty = {
    id: makeLocalId(), branchId: LOCAL_BRANCH_ID, code: `ML-${String(highestCode + 1).padStart(4, '0')}`,
    title: body.title, address: body.address, type: body.type, transaction: body.transaction,
    areaSqm: body.areaSqm, bedrooms: body.bedrooms, salePrice: body.salePrice ?? null,
    deposit: body.deposit ?? null, monthlyRent: body.monthlyRent ?? null, currency: body.currency,
    status: body.status ?? 'ACTIVE', createdAt: now.toISOString(), assignedTo: LOCAL_USER_ID,
  };
  const mapped = mapProperty(row, LOCAL_USER_ID, LOCAL_USER_NAME);
  return { ...mapped, image: '', type: types[body.type], status, apiStatus: row.status, date: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short' }).format(now) };
}

export function makeLocalCustomerRecord(input: {
  fullName: string; phone: string; email: string | null; kind: CustomerRecord['kind'];
  targetTransaction: CustomerRecord['targetTransaction']; preferredPropertyType: CustomerRecord['preferredPropertyType'];
  budgetMin: string | null; budgetMax: string | null; currency: CustomerRecord['currency'];
  preferredArea: string | null; notes: string | null; status?: CustomerRecord['status'];
}, existing: CustomerRecord[] = [], prior?: CustomerRecord, now = new Date()): CustomerRecord {
  const fullName = input.fullName.trim();
  if (!fullName) throw new Error('نام مشتری را وارد کنید.');
  if (!input.phone.trim()) throw new Error('شماره تماس را وارد کنید.');
  const min = input.budgetMin?.trim() || null;
  const max = input.budgetMax?.trim() || null;
  if (min && !/^\d+$/.test(min) || max && !/^\d+$/.test(max)) throw new Error('بودجه باید عدد صحیح باشد.');
  if (min && max && BigInt(min) > BigInt(max)) throw new Error('حداقل بودجه نباید از حداکثر بودجه بیشتر باشد.');
  return {
    id: prior?.id ?? makeLocalId(), branchId: LOCAL_BRANCH_ID,
    code: prior?.code ?? `C-${String(existing.length + 1).padStart(4, '0')}`,
    fullName, phone: input.phone.trim(), email: input.email, kind: input.kind,
    targetTransaction: input.targetTransaction, preferredPropertyType: input.preferredPropertyType,
    budgetMin: min, budgetMax: max, currency: input.currency, preferredArea: input.preferredArea,
    notes: input.notes, status: input.status ?? 'NEW', assignedTo: LOCAL_USER_ID,
    createdAt: prior?.createdAt ?? now.toISOString(), archivedAt: prior?.archivedAt ?? null,
  };
}

export function customerRecordFromView(customer: CustomerView): CustomerRecord {
  const { kindLabel: _kindLabel, statusLabel: _statusLabel, budgetLabel: _budgetLabel, assignedLabel: _assignedLabel, createdLabel: _createdLabel, ...record } = customer;
  return record;
}
