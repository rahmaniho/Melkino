import { describe, expect, it } from 'vitest';
import { normalizeDigits } from './numbers.js';
import { canManageProperty, canReadProperty, validatePropertyStatusTransition, validateTransactionPrices } from './property-rules.js';
import type { TenantActor } from '../common/request-context.js';

const agent: TenantActor = { userId: 'agent-1', tenantId: 'tenant-1', branchId: 'branch-1', role: 'AGENT' };
const record = { tenantId: 'tenant-1', branchId: 'branch-1', assignedTo: 'agent-1' };

describe('API property security and validation rules', () => {
  it('normalizes both Persian and Arabic digits for decimal input', () => {
    expect(normalizeDigits('۲۲۰٫۵')).toBe('220.5');
    expect(normalizeDigits('١٬٢٥٠')).toBe('1250');
  });

  it('scopes an agent to assigned records within their authenticated branch and tenant', () => {
    expect(canReadProperty(agent, record)).toBe(true);
    expect(canReadProperty(agent, { ...record, assignedTo: 'agent-2' })).toBe(false);
    expect(canReadProperty(agent, { ...record, branchId: 'branch-2' })).toBe(false);
    expect(canReadProperty(agent, { ...record, tenantId: 'tenant-2' })).toBe(false);
    expect(canManageProperty(agent, record)).toBe(true);
    expect(canManageProperty({ ...agent, role: 'ACCOUNTANT' }, record)).toBe(false);
  });

  it('requires explicit, integer money amounts for each transaction mode', () => {
    expect(() => validateTransactionPrices({ transaction: 'SALE', salePrice: '0' })).toThrow(/مبلغ فروش/);
    expect(() => validateTransactionPrices({ transaction: 'SALE', salePrice: '5000000000' })).not.toThrow();
    expect(() => validateTransactionPrices({ transaction: 'RENT', monthlyRent: '45000000' })).not.toThrow();
    expect(() => validateTransactionPrices({ transaction: 'MORTGAGE_RENT', deposit: '0', monthlyRent: '10000000' })).not.toThrow();
    expect(() => validateTransactionPrices({ transaction: 'MORTGAGE_RENT', deposit: '100000000' })).toThrow(/مبلغ رهن/);
    expect(() => validateTransactionPrices({ transaction: 'SALE', salePrice: '1000', monthlyRent: '500' })).toThrow(/فقط مبلغ فروش/);
    expect(() => validateTransactionPrices({ transaction: 'RENT', monthlyRent: '12.5' })).toThrow(/اجاره ماهانه/);
  });

  it('rejects invalid property status transitions and leaves archival explicit', () => {
    expect(() => validatePropertyStatusTransition('ACTIVE', 'UNDER_VISIT')).not.toThrow();
    expect(() => validatePropertyStatusTransition('ACTIVE', 'ARCHIVED')).toThrow(/مجاز نیست/);
    expect(() => validatePropertyStatusTransition('ARCHIVED', 'ACTIVE')).toThrow(/مجاز نیست/);
  });
});
