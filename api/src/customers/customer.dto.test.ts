import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateCustomerDto, ListCustomersQuery, UpdateCustomerDto } from './customer.dto.js';

const validCustomer = {
  branchId: '123e4567-e89b-42d3-a456-426614174000', fullName: '  مریم رضایی  ', phone: '۰۹۱۲۱۲۳۴۵۶۷',
  email: 'm.razavi@example.com', kind: 'BUYER', targetTransaction: 'SALE', preferredPropertyType: 'APARTMENT',
  budgetMin: '۱۰۰٬۰۰۰', budgetMax: '۹۰۰۰۰۰', currency: 'IRT', preferredArea: ' زعفرانیه ', notes: ' تماس عصر ',
};

describe('customer CRM API validation', () => {
  it('trims text and normalizes Persian phone and budget digits', async () => {
    const dto = plainToInstance(CreateCustomerDto, validCustomer);
    expect(dto.fullName).toBe('مریم رضایی');
    expect(dto.phone).toBe('09121234567');
    expect(dto.budgetMin).toBe('100000');
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects malformed phone, email, monetary fractions, and extra fields', async () => {
    const dto = plainToInstance(CreateCustomerDto, { ...validCustomer, phone: '123', email: 'not-an-email', budgetMin: '۱٫۵', tenantId: 'forged' });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['phone', 'email', 'budgetMin', 'tenantId']));
  });

  it('accepts only defined lead statuses and strict archive filters', async () => {
    const good = plainToInstance(UpdateCustomerDto, { status: 'QUALIFIED' });
    const bad = plainToInstance(UpdateCustomerDto, { status: 'ARCHIVED' });
    const filter = plainToInstance(ListCustomersQuery, { includeArchived: 'false', limit: '40' });
    const badFilter = plainToInstance(ListCustomersQuery, { includeArchived: 'sometimes' });
    expect(await validate(good)).toHaveLength(0);
    expect((await validate(bad)).some((error) => error.property === 'status')).toBe(true);
    expect(filter.includeArchived).toBe(false);
    expect(await validate(filter)).toHaveLength(0);
    expect((await validate(badFilter)).some((error) => error.property === 'includeArchived')).toBe(true);
  });
});
