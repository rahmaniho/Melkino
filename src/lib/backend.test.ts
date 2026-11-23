import { describe, expect, it } from 'vitest';
import { mapProperty, type ApiProperty } from './backend';

const record: ApiProperty = {
  id: '11111111-1111-4111-8111-111111111111',
  branchId: '33333333-3333-4333-8333-333333333333',
  code: 'ML-A1',
  title: 'آپارتمان تست',
  address: 'تهران، زعفرانیه',
  type: 'APARTMENT',
  transaction: 'SALE',
  areaSqm: '125.50',
  bedrooms: 2,
  salePrice: '12345678901234567890',
  deposit: null,
  monthlyRent: null,
  currency: 'IRT',
  status: 'ACTIVE',
  createdAt: '2026-11-22T10:00:00.000Z',
  assignedTo: '22222222-2222-4222-8222-222222222222',
};

describe('API property adapter', () => {
  it('maps persisted API fields to the Persian file-list model without rounding large prices', () => {
    const mapped = mapProperty(record, record.assignedTo, 'مشاور جاری');
    expect(mapped).toMatchObject({
      id: record.id,
      branchId: record.branchId,
      code: 'ML-A1',
      area: 'تهران، زعفرانیه',
      size: 125.5,
      beds: 2,
      price: '۱۲٬۳۴۵٬۶۷۸٬۹۰۱٬۲۳۴٬۵۶۷٬۸۹۰',
      currency: 'تومان',
      status: 'فعال',
      agent: 'مشاور جاری',
    });
  });

  it('maps archived status and rent prices with explicit currency', () => {
    const mapped = mapProperty({ ...record, status: 'ARCHIVED', transaction: 'RENT', salePrice: null, monthlyRent: '85000000', currency: 'IRR' });
    expect(mapped.status).toBe('بایگانی');
    expect(mapped.price).toBe('۸۵٬۰۰۰٬۰۰۰ / ماه');
    expect(mapped.currency).toBe('ریال');
  });

  it('shows both deposit and monthly rent without coercing monetary values to floats', () => {
    const mapped = mapProperty({ ...record, transaction: 'MORTGAGE_RENT', salePrice: null, deposit: '5000000000', monthlyRent: '70000000' });
    expect(mapped.price).toBe('ودیعه ۵٬۰۰۰٬۰۰۰٬۰۰۰ · اجاره ۷۰٬۰۰۰٬۰۰۰ / ماه');
  });
});
