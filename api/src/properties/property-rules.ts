import type { TenantActor } from '../common/request-context.js';

export type PropertyAccessRecord = { tenantId: string; branchId: string; assignedTo: string };
export type PriceFields = { transaction: string; salePrice?: string | null; deposit?: string | null; monthlyRent?: string | null };

export function canReadProperty(actor: TenantActor, property: PropertyAccessRecord): boolean {
  if (actor.tenantId !== property.tenantId) return false;
  if (actor.branchId && actor.branchId !== property.branchId) return false;
  return actor.role !== 'AGENT' || actor.userId === property.assignedTo;
}

export function canManageProperty(actor: TenantActor, property: PropertyAccessRecord): boolean {
  if (!canReadProperty(actor, property)) return false;
  if (actor.role === 'OWNER' || actor.role === 'BRANCH_MANAGER' || actor.role === 'SALES_MANAGER') return true;
  return actor.role === 'AGENT' && actor.userId === property.assignedTo;
}

export function validateTransactionPrices(input: PriceFields): void {
  const positive = (value?: string | null) => value !== undefined && value !== null && /^\d{1,20}$/.test(value) && BigInt(value) > 0n;
  const nonNegative = (value?: string | null) => value !== undefined && value !== null && /^\d{1,20}$/.test(value);
  if (input.transaction === 'SALE' && (!positive(input.salePrice) || input.deposit != null || input.monthlyRent != null)) throw new Error('برای معامله فروش، فقط مبلغ فروش را وارد کنید.');
  if (input.transaction === 'RENT' && (!positive(input.monthlyRent) || input.salePrice != null || input.deposit != null)) throw new Error('برای اجاره، فقط مبلغ اجاره ماهانه را وارد کنید.');
  if (input.transaction === 'MORTGAGE_RENT' && (!nonNegative(input.deposit) || !positive(input.monthlyRent) || input.salePrice != null)) throw new Error('برای رهن و اجاره، مبلغ رهن و اجاره ماهانه را وارد کنید.');
  if (['EXCHANGE', 'OTHER'].includes(input.transaction) && (input.salePrice != null || input.deposit != null || input.monthlyRent != null)) throw new Error('برای این نوع معامله مبلغ فروش/اجاره ثبت نکنید.');
}

export function validatePropertyStatusTransition(current: string, next: string): void {
  const transitions: Record<string, string[]> = {
    ACTIVE: ['UNDER_VISIT', 'NEGOTIATING'],
    UNDER_VISIT: ['ACTIVE', 'NEGOTIATING'],
    NEGOTIATING: ['ACTIVE', 'UNDER_VISIT'],
  };
  if (current === next) return;
  if (!transitions[current]?.includes(next)) throw new Error('تغییر وضعیت ملک مجاز نیست.');
}
