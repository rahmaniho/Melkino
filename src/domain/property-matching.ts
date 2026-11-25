import type { CustomerRecord } from './customers';
import type { Property } from './properties';

export type PropertyMatch = {
  property: Property;
  score: number | null;
  reasons: string[];
};

const propertyTypes: Record<string, string> = {
  APARTMENT: 'آپارتمان', VILLA: 'ویلا', LAND: 'زمین', COMMERCIAL: 'تجاری', OFFICE: 'اداری', OTHER: 'سایر',
};

function normalize(value: string): string {
  return value.toLocaleLowerCase('fa').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[\u200c\u200e\u200f]/g, ' ').replace(/\s+/g, ' ').trim();
}

function toRials(amount: string | null | undefined, currency: string | undefined): bigint | null {
  if (!amount) return null;
  const digits = amount.replace(/[۰-۹٠-٩]/g, (digit) => String(digit >= '۰' && digit <= '۹'
    ? digit.charCodeAt(0) - '۰'.charCodeAt(0)
    : digit.charCodeAt(0) - '٠'.charCodeAt(0))).replace(/[٬,\s]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  const value = BigInt(digits);
  return currency === 'IRT' || currency === 'تومان' ? value * 10n : value;
}

function amountFor(property: Property): string | null {
  if (property.transaction === 'SALE') return property.salePrice ?? null;
  if (property.transaction === 'RENT') return property.monthlyRent ?? null;
  if (property.transaction === 'MORTGAGE_RENT') return property.deposit ?? null;
  return null;
}

/** Ranks only real, accessible property records; omitted customer preferences do not reduce the score. */
export function matchPropertiesForCustomer(customer: CustomerRecord, properties: Property[]): PropertyMatch[] {
  const hasBudget = Boolean(customer.budgetMin || customer.budgetMax);
  const minimum = customer.budgetMin ? toRials(customer.budgetMin, customer.currency) : null;
  const maximum = customer.budgetMax ? toRials(customer.budgetMax, customer.currency) : null;
  const areaPreference = customer.preferredArea ? normalize(customer.preferredArea) : '';
  const applicableWeight = (customer.targetTransaction ? 30 : 0)
    + (customer.preferredPropertyType ? 20 : 0)
    + (areaPreference ? 25 : 0)
    + (hasBudget ? 25 : 0);

  return properties.flatMap((property): PropertyMatch[] => {
    if (property.status === 'بایگانی' || (property.branchId && property.branchId !== customer.branchId)) return [];
    if (customer.targetTransaction && customer.targetTransaction !== property.transaction) return [];
    if (customer.preferredPropertyType && propertyTypes[customer.preferredPropertyType] !== property.type) return [];

    const reasons: string[] = [];
    let earned = 0;
    if (customer.targetTransaction) { earned += 30; reasons.push('نوع معامله مطابق نیاز'); }
    if (customer.preferredPropertyType) { earned += 20; reasons.push('نوع ملک مطابق نیاز'); }
    if (areaPreference) {
      if (!normalize(property.area).includes(areaPreference)) return [];
      earned += 25;
      reasons.push('محدودهٔ موردنظر');
    }
    if (hasBudget) {
      const price = toRials(amountFor(property), property.currency);
      if (!price || (minimum !== null && price < minimum) || (maximum !== null && price > maximum)) return [];
      earned += 25;
      reasons.push('بودجه در بازه');
    }
    if (applicableWeight === 0) reasons.push('بدون فیلتر نیازمندی');

    return [{ property, score: applicableWeight ? Math.round(earned / applicableWeight * 100) : null, reasons }];
  }).sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.property.code.localeCompare(b.property.code, 'fa'));
}
