import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateFollowUpDto, ListFollowUpsQuery } from './follow-up.dto.js';

const valid = {
  branchId: '123e4567-e89b-42d3-a456-426614174000',
  customerId: '223e4567-e89b-42d3-a456-426614174000',
  propertyId: '323e4567-e89b-42d3-a456-426614174000',
  title: ' پیگیری بازدید ', kind: 'PROPERTY_VISIT', dueAt: '2026-11-23T10:00:00.000Z', details: ' یادداشت ',
};

describe('follow-up API validation', () => {
  it('trims text and validates ISO due dates and linked IDs', async () => {
    const dto = plainToInstance(CreateFollowUpDto, valid);
    expect(dto.title).toBe('پیگیری بازدید');
    expect(dto.details).toBe('یادداشت');
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects malformed dates, IDs, types, and client-supplied tenant fields', async () => {
    const dto = plainToInstance(CreateFollowUpDto, { ...valid, dueAt: 'فردا', kind: 'WHATSAPP', customerId: 'bad', tenantId: 'forged' });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['dueAt', 'kind', 'customerId', 'tenantId']));
  });

  it('accepts only known status filters and bounded pagination', async () => {
    const good = plainToInstance(ListFollowUpsQuery, { status: 'OPEN', limit: '25' });
    const bad = plainToInstance(ListFollowUpsQuery, { status: 'REMIND_ME', limit: '1000' });
    expect(await validate(good)).toHaveLength(0);
    expect((await validate(bad)).map((error) => error.property)).toEqual(expect.arrayContaining(['status', 'limit']));
  });
});
