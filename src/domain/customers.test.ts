import { describe, expect, it } from 'vitest';
import { customerTelHref, exportCustomersCsv, mapCustomer, type CustomerRecord } from './customers';

const customer: CustomerRecord = {
  id: '11111111-1111-4111-8111-111111111111', branchId: '33333333-3333-4333-8333-333333333333', code: 'CU-123', fullName: 'مریم رضایی', phone: '09121234567', email: null,
  kind: 'BUYER', targetTransaction: 'SALE', preferredPropertyType: 'APARTMENT', budgetMin: '10000000000', budgetMax: '90000000000',
  currency: 'IRT', preferredArea: 'زعفرانیه', notes: null, status: 'NEW', assignedTo: '22222222-2222-4222-8222-222222222222',
  createdAt: '2026-11-22T10:00:00.000Z', archivedAt: null,
};

describe('customer adapter and export', () => {
  it('maps Persian labels and exact currency amounts', () => {
    expect(mapCustomer(customer, customer.assignedTo, 'مشاور فعلی')).toMatchObject({
      kindLabel: 'خریدار', statusLabel: 'سرنخ جدید', budgetLabel: '۱۰٬۰۰۰٬۰۰۰٬۰۰۰ تا ۹۰٬۰۰۰٬۰۰۰٬۰۰۰ تومان', assignedLabel: 'مشاور فعلی',
    });
  });

  it('creates normalized one-tap phone links from Persian and Arabic digits', () => {
    expect(customerTelHref('۰۹۱۲ ۱۲۳-۴۵۶۷')).toBe('tel:09121234567');
    expect(customerTelHref('+٩٨ (٩١٢) ١٢٣ ٤٥٦٧')).toBe('tel:+989121234567');
  });

  it('exports safe UTF-8 CSV without leaking internal notes', () => {
    const csv = exportCustomersCsv([mapCustomer({ ...customer, fullName: 'مریم، «رضایی»', notes: 'اطلاعات حساس' })]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"کد مشتری","نام","تلفن"');
    expect(csv).toContain('"مریم، «رضایی»"');
    expect(csv).not.toContain('اطلاعات حساس');
  });

  it('neutralizes spreadsheet formula injection in untrusted CRM text', () => {
    const csv = exportCustomersCsv([mapCustomer({ ...customer, fullName: '=HYPERLINK("https://evil.invalid")' })]);
    expect(csv).toContain("'=HYPERLINK");
  });
});
