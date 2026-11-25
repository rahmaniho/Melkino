export type MoneyCurrency = 'IRT' | 'IRR';
export type CommissionStatus = 'OPEN' | 'PAID';
export type CommissionRecord = {
  id: string;
  userId: string;
  title: string;
  propertyId: string | null;
  customerId: string | null;
  transactionId?: string | null;
  transactionAmount: string;
  commissionRateBasisPoints: number;
  currency: MoneyCurrency;
  dueDate: string | null;
  status: CommissionStatus;
  createdAt: string;
};

export function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => String(digit >= '۰' && digit <= '۹'
    ? digit.charCodeAt(0) - '۰'.charCodeAt(0)
    : digit.charCodeAt(0) - '٠'.charCodeAt(0)));
}

export function parseMoney(value: string): string {
  const normalized = normalizeDigits(value).replace(/[٬,\s]/g, '');
  if (!/^\d+$/.test(normalized)) throw new Error('مبلغ باید عدد صحیح و مثبت باشد.');
  const amount = BigInt(normalized);
  if (amount <= 0n || amount > 999_999_999_999_999_999n) throw new Error('مبلغ خارج از بازهٔ مجاز است.');
  return amount.toString();
}

export function parseCommissionRate(value: string): number {
  const normalized = normalizeDigits(value.trim()).replace(/[٪%\s]/g, '').replace(/[٫،,]/g, '.');
  if (!/^(?:\d{1,3})(?:\.\d{1,2})?$/.test(normalized)) throw new Error('درصد کمیسیون را تا دو رقم اعشار وارد کنید.');
  const [whole, fraction = ''] = normalized.split('.');
  const basisPoints = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (basisPoints <= 0 || basisPoints > 10_000) throw new Error('درصد کمیسیون باید بیشتر از صفر و حداکثر ۱۰۰ باشد.');
  return basisPoints;
}

export function calculateCommission(amount: string, rateBasisPoints: number): string {
  if (!/^\d+$/.test(amount) || !Number.isInteger(rateBasisPoints) || rateBasisPoints <= 0 || rateBasisPoints > 10_000) {
    throw new Error('اطلاعات محاسبهٔ کمیسیون معتبر نیست.');
  }
  return ((BigInt(amount) * BigInt(rateBasisPoints) + 5_000n) / 10_000n).toString();
}

export function commissionLabelBasisPoints(rateBasisPoints: number): string {
  return new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(rateBasisPoints / 100);
}

export function readCommissionRecords(storage: Pick<Storage, 'getItem'>, key: string, userId: string): CommissionRecord[] {
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is CommissionRecord => Boolean(item && typeof item === 'object'
      && (item as CommissionRecord).userId === userId && typeof (item as CommissionRecord).id === 'string'
      && typeof (item as CommissionRecord).title === 'string' && typeof (item as CommissionRecord).transactionAmount === 'string'
      && /^\d+$/.test((item as CommissionRecord).transactionAmount)
      && Number.isInteger((item as CommissionRecord).commissionRateBasisPoints)
      && (item as CommissionRecord).commissionRateBasisPoints > 0 && (item as CommissionRecord).commissionRateBasisPoints <= 10_000
      && ['IRT', 'IRR'].includes((item as CommissionRecord).currency)
      && ['OPEN', 'PAID'].includes((item as CommissionRecord).status)))
      .map((record) => ({ ...record, transactionId: typeof record.transactionId === 'string' ? record.transactionId : null }));
  } catch {
    return [];
  }
}

export function writeCommissionRecords(storage: Pick<Storage, 'setItem'>, key: string, records: CommissionRecord[]): void {
  storage.setItem(key, JSON.stringify(records));
}
