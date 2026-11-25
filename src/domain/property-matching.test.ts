import { describe, expect, it } from 'vitest';
import type { CustomerRecord } from './customers';
import type { Property } from './properties';
import { matchPropertiesForCustomer } from './property-matching';

const customer: CustomerRecord = {
  id: 'customer-1', branchId: 'branch-1', code: 'CU-1', fullName: 'مشتری نمونه', phone: '09120000000', email: null,
  kind: 'BUYER', targetTransaction: 'SALE', preferredPropertyType: 'APARTMENT', budgetMin: '10000000000', budgetMax: '20000000000',
  currency: 'IRT', preferredArea: 'سعادت آباد', notes: null, status: 'QUALIFIED', assignedTo: 'agent-1',
  createdAt: '2026-01-01T00:00:00.000Z', archivedAt: null,
};

const property = (overrides: Partial<Property> = {}): Property => ({
  id: 'property-1', branchId: 'branch-1', code: 'ML-1', title: 'آپارتمان نمونه', area: 'سعادت‌آباد، بلوار اصلی',
  type: 'آپارتمان', size: 120, beds: 2, price: '۱۵ میلیارد', image: '', status: 'فعال', agent: 'مشاور', date: 'امروز',
  transaction: 'SALE', salePrice: '15000000000', currency: 'IRT', ...overrides,
});

describe('customer-property matching', () => {
  it('matches transaction, property type, Persian-normalized area and budget', () => {
    const [match] = matchPropertiesForCustomer(customer, [property()]);
    expect(match.score).toBe(100);
    expect(match.reasons).toHaveLength(4);
  });

  it('converts rials and tomans before checking the budget range', () => {
    const match = matchPropertiesForCustomer({ ...customer, currency: 'IRR', budgetMin: '100000000000', budgetMax: '200000000000' }, [property({ currency: 'IRT', salePrice: '15000000000' })]);
    expect(match).toHaveLength(1);
    expect(match[0].score).toBe(100);
  });

  it('excludes archived, cross-branch, mismatched and out-of-budget listings', () => {
    const result = matchPropertiesForCustomer(customer, [
      property({ code: 'ML-1' }),
      property({ code: 'ML-2', status: 'بایگانی' }),
      property({ code: 'ML-3', branchId: 'branch-2' }),
      property({ code: 'ML-4', type: 'ویلا' }),
      property({ code: 'ML-5', transaction: 'RENT', monthlyRent: '1000000' }),
      property({ code: 'ML-6', salePrice: '25000000000' }),
      property({ code: 'ML-7', area: 'نیاوران', salePrice: '15000000000' }),
    ]);
    expect(result.map((match) => match.property.code)).toEqual(['ML-1']);
  });

  it('does not impose unspecified preferences, and excludes unpriced records when a budget is set', () => {
    const noPreferences = matchPropertiesForCustomer({ ...customer, targetTransaction: null, preferredPropertyType: null, preferredArea: null, budgetMin: null, budgetMax: null }, [property({ salePrice: null })]);
    expect(noPreferences).toHaveLength(1);
    expect(noPreferences[0].score).toBeNull();
    expect(matchPropertiesForCustomer({ ...customer, targetTransaction: null, preferredPropertyType: null, preferredArea: null }, [property({ salePrice: null })])).toHaveLength(0);
  });
});
