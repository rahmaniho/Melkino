import { describe, expect, it } from 'vitest';
import { initialProperties } from './properties';
import type { PropertyWrite } from '../lib/backend';
import {
  LOCAL_PROPERTY_KEY, makeLocalCustomerRecord, makeLocalProperty, readLocalProperties, writeLocalProperties,
} from './local-workspace';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key) { return values.get(key) ?? null; },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(key); },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

const propertyDraft: PropertyWrite = {
  branchId: 'ignored-in-local-mode', title: 'واحد نورگیر', address: 'فرانکفورت', type: 'APARTMENT',
  transaction: 'SALE', areaSqm: '125', bedrooms: 2, salePrice: '9800000000', currency: 'IRT',
};

describe('local workspace persistence', () => {
  it('starts empty and never falls back to the demo property set', () => {
    const storage = memoryStorage();
    expect(initialProperties.length).toBeGreaterThan(0);
    expect(readLocalProperties(storage)).toEqual([]);
  });

  it('writes and reads only validated local property records', () => {
    const storage = memoryStorage();
    const property = makeLocalProperty(propertyDraft, [], new Date('2026-11-22T10:00:00Z'));
    writeLocalProperties(storage, [property]);
    expect(JSON.parse(storage.getItem(LOCAL_PROPERTY_KEY) ?? '[]')).toHaveLength(1);
    expect(readLocalProperties(storage)).toEqual([property]);
    storage.setItem(LOCAL_PROPERTY_KEY, JSON.stringify([{ title: 'bad' }, property]));
    expect(readLocalProperties(storage)).toEqual([property]);
  });

  it('creates real customer records with generated IDs and rejects invalid budgets', () => {
    const customer = makeLocalCustomerRecord({
      fullName: 'مریم رضایی', phone: '09120000000', email: null, kind: 'BUYER',
      targetTransaction: 'SALE', preferredPropertyType: 'APARTMENT', budgetMin: '100', budgetMax: '200',
      currency: 'IRT', preferredArea: 'مرکز شهر', notes: null,
    }, [], undefined, new Date('2026-11-22T10:00:00Z'));
    expect(customer.id).toBeTruthy();
    expect(customer.branchId).toBeTruthy();
    expect(customer.status).toBe('NEW');
    expect(() => makeLocalCustomerRecord({
      fullName: 'مریم رضایی', phone: '09120000000', email: null, kind: 'BUYER',
      targetTransaction: null, preferredPropertyType: null, budgetMin: '200', budgetMax: '100',
      currency: 'IRT', preferredArea: null, notes: null,
    })).toThrow('حداقل بودجه نباید از حداکثر بودجه بیشتر باشد.');
  });
});
