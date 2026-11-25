import type { CustomerView } from './customers';
import type { Property } from './properties';
import { parseMoney, type MoneyCurrency } from './finance';

export const transactionStages = ['VISIT', 'NEGOTIATION', 'CONTRACT', 'CLOSED', 'CANCELLED'] as const;
export type TransactionStage = typeof transactionStages[number];
export const transactionStageLabels: Record<TransactionStage, string> = {
  VISIT: 'بازدید / ارزیابی', NEGOTIATION: 'مذاکره', CONTRACT: 'قرارداد', CLOSED: 'نهایی‌شده', CANCELLED: 'لغوشده',
};
export type TransactionHistoryEntry = { stage: TransactionStage; changedAt: string };
export type TransactionRecord = {
  id: string;
  userId: string;
  propertyId: string;
  customerId: string;
  agreedAmount: string | null;
  currency: MoneyCurrency;
  stage: TransactionStage;
  expectedCloseDate: string | null;
  notes: string;
  history: TransactionHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};
export type TransactionDraft = {
  propertyId: string;
  customerId: string;
  agreedAmount: string;
  currency: MoneyCurrency;
  stage: TransactionStage;
  expectedCloseDate: string;
  notes: string;
};

export function validateTransactionDraft(draft: TransactionDraft, properties: Property[], customers: CustomerView[], allowArchivedRelations = false): Omit<TransactionRecord, 'id' | 'userId' | 'history' | 'createdAt' | 'updatedAt'> {
  const property = properties.find((item) => item.id === draft.propertyId && (allowArchivedRelations || item.status !== 'بایگانی'));
  if (!property) throw new Error('ملک فعال و قابل‌دسترسی را انتخاب کنید.');
  const customer = customers.find((item) => item.id === draft.customerId && (allowArchivedRelations || item.status !== 'ARCHIVED'));
  if (!customer) throw new Error('مشتری فعال و قابل‌دسترسی را انتخاب کنید.');
  if (!property.branchId || property.branchId !== customer.branchId) throw new Error('ملک و مشتری باید متعلق به یک شعبهٔ قابل‌دسترسی باشند.');
  if (!transactionStages.includes(draft.stage)) throw new Error('مرحلهٔ معامله معتبر نیست.');
  const agreedAmount = draft.agreedAmount.trim() ? parseMoney(draft.agreedAmount) : null;
  if ((draft.stage === 'CONTRACT' || draft.stage === 'CLOSED') && !agreedAmount) throw new Error('برای قرارداد یا معاملهٔ نهایی، مبلغ توافق‌شده را وارد کنید.');
  if (draft.expectedCloseDate && !/^\d{4}-\d{2}-\d{2}$/.test(draft.expectedCloseDate)) throw new Error('تاریخ پیش‌بینی‌شده معتبر نیست.');
  if (draft.notes.trim().length > 2000) throw new Error('یادداشت معامله حداکثر ۲۰۰۰ نویسه است.');
  return {
    propertyId: property.id!, customerId: customer.id, agreedAmount, currency: draft.currency,
    stage: draft.stage, expectedCloseDate: draft.expectedCloseDate || null, notes: draft.notes.trim(),
  };
}

export function createTransactionRecord(draft: TransactionDraft, userId: string, properties: Property[], customers: CustomerView[], now = new Date(), id: string = crypto.randomUUID()): TransactionRecord {
  const valid = validateTransactionDraft(draft, properties, customers);
  const timestamp = now.toISOString();
  return { ...valid, id, userId, history: [{ stage: valid.stage, changedAt: timestamp }], createdAt: timestamp, updatedAt: timestamp };
}

export function updateTransactionRecord(record: TransactionRecord, draft: TransactionDraft, properties: Property[], customers: CustomerView[], now = new Date()): TransactionRecord {
  const valid = validateTransactionDraft(draft, properties, customers, true);
  const history = record.stage === valid.stage ? record.history : [...record.history, { stage: valid.stage, changedAt: now.toISOString() }];
  return { ...record, ...valid, history, updatedAt: now.toISOString() };
}

export function readTransactionRecords(storage: Pick<Storage, 'getItem'>, key: string, userId: string): TransactionRecord[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is TransactionRecord => Boolean(item && typeof item === 'object'
      && (item as TransactionRecord).userId === userId && typeof (item as TransactionRecord).id === 'string'
      && typeof (item as TransactionRecord).propertyId === 'string' && typeof (item as TransactionRecord).customerId === 'string'
      && ((item as TransactionRecord).agreedAmount === null || (typeof (item as TransactionRecord).agreedAmount === 'string' && /^\d+$/.test((item as TransactionRecord).agreedAmount!)))
      && ['IRT', 'IRR'].includes((item as TransactionRecord).currency)
      && transactionStages.includes((item as TransactionRecord).stage)
      && Array.isArray((item as TransactionRecord).history)
      && typeof (item as TransactionRecord).createdAt === 'string' && typeof (item as TransactionRecord).updatedAt === 'string'));
  } catch {
    return [];
  }
}

export function writeTransactionRecords(storage: Pick<Storage, 'setItem'>, key: string, records: TransactionRecord[]): void {
  storage.setItem(key, JSON.stringify(records));
}

export function transactionStageLabel(stage: TransactionStage): string {
  return transactionStageLabels[stage];
}
