import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
export const tenantId = import.meta.env.VITE_TENANT_ID?.trim() ?? '';
export const defaultBranchId = import.meta.env.VITE_DEFAULT_BRANCH_ID?.trim() ?? '';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') || '/api/v1';
const isPlaceholder = (value: string) => /your-melkino-project|replace-with|00000000-0000-4000-8000-000000000000/i.test(value);
export const backendConfigured = Boolean(supabaseUrl && supabaseAnonKey && tenantId && defaultBranchId)
  && ![supabaseUrl, supabaseAnonKey, tenantId, defaultBranchId].some(isPlaceholder);

export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export type ApiProperty = {
  id: string;
  branchId: string;
  code: string;
  title: string;
  address: string;
  type: 'APARTMENT' | 'VILLA' | 'LAND' | 'COMMERCIAL' | 'OFFICE' | 'OTHER';
  transaction: 'SALE' | 'RENT' | 'MORTGAGE_RENT' | 'EXCHANGE' | 'OTHER';
  areaSqm: string;
  bedrooms: number;
  salePrice: string | null;
  deposit: string | null;
  monthlyRent: string | null;
  currency: 'IRR' | 'IRT';
  status: 'ACTIVE' | 'UNDER_VISIT' | 'NEGOTIATING' | 'ARCHIVED';
  createdAt: string;
  assignedTo: string;
};

export type PropertyWrite = {
  branchId: string;
  title: string;
  address: string;
  type: ApiProperty['type'];
  transaction: ApiProperty['transaction'];
  areaSqm: string;
  bedrooms: number;
  salePrice?: string;
  deposit?: string;
  monthlyRent?: string;
  currency: ApiProperty['currency'];
  status?: ApiProperty['status'];
};

export type AuthSession = Session;

export function authProblemMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'ایمیل یا گذرواژه درست نیست.';
  if (lower.includes('email not confirmed')) return 'ابتدا ایمیل خود را تأیید کنید.';
  if (lower.includes('network') || lower.includes('fetch')) return 'ارتباط با سرویس احراز هویت برقرار نشد.';
  if (lower.includes('too many requests')) return 'تعداد تلاش‌ها زیاد است؛ کمی بعد دوباره امتحان کنید.';
  return message || 'ورود انجام نشد. دوباره تلاش کنید.';
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, session: Session, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'X-Tenant-Id': tenantId,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => null) as { message?: unknown; code?: string } | null;
  const detail = typeof body?.message === 'string' ? body.message
    : Array.isArray(body?.message) ? body.message.filter((item): item is string => typeof item === 'string').join('، ')
    : '';
  if (!response.ok) throw new ApiError(detail || `پاسخ سرور ناموفق بود (${response.status}).`, response.status, body?.code);
  return body as T;
}

export function mapProperty(row: ApiProperty, currentUserId?: string, currentUserName?: string) {
  const formatAmount = (amount: string | null) => amount ? new Intl.NumberFormat('fa-IR').format(BigInt(amount)) : '';
  const unit = row.currency === 'IRT' ? 'تومان' : 'ریال';
  const priceText = row.transaction === 'SALE' ? `${formatAmount(row.salePrice)}`
    : row.transaction === 'RENT' ? `${formatAmount(row.monthlyRent)} / ماه`
    : row.transaction === 'MORTGAGE_RENT' ? `ودیعه ${formatAmount(row.deposit)} · اجاره ${formatAmount(row.monthlyRent)} / ماه`
    : 'توافقی';
  const statuses = { ACTIVE: 'فعال', UNDER_VISIT: 'بازدید', NEGOTIATING: 'در مذاکره', ARCHIVED: 'بایگانی' } as const;
  const typeNames = { APARTMENT: 'آپارتمان', VILLA: 'ویلا', LAND: 'زمین', COMMERCIAL: 'تجاری', OFFICE: 'اداری', OTHER: 'سایر' } as const;
  return {
    id: row.id,
    branchId: row.branchId,
    code: row.code,
    title: row.title,
    area: row.address,
    type: typeNames[row.type],
    size: Number(row.areaSqm),
    beds: row.bedrooms,
    price: priceText,
    currency: unit,
    image: '',
    status: statuses[row.status],
    agent: row.assignedTo === currentUserId ? currentUserName || 'کاربر جاری' : 'مشاور تیم',
    date: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short' }).format(new Date(row.createdAt)),
    transaction: row.transaction,
    salePrice: row.salePrice,
    deposit: row.deposit,
    monthlyRent: row.monthlyRent,
    apiStatus: row.status,
    createdAt: row.createdAt,
  };
}
