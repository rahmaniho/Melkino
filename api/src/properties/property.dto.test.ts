import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreatePropertyDto, ListPropertiesQuery } from './property.dto.js';

const validProperty = {
  branchId: '123e4567-e89b-42d3-a456-426614174000',
  title: '  آپارتمان  ', address: '  خیابان ولیعصر  ', type: 'APARTMENT', transaction: 'SALE',
  areaSqm: '۱۲۵٫۵', bedrooms: '۳', salePrice: '۱۵۰۰۰۰۰۰۰۰۰', currency: 'IRT',
};

describe('property API request validation', () => {
  it('normalizes Persian amounts and trims required text before validation', async () => {
    const dto = plainToInstance(CreatePropertyDto, validProperty);
    expect(dto.title).toBe('آپارتمان');
    expect(dto.areaSqm).toBe('125.5');
    expect(dto.bedrooms).toBe(3);
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects nulls, blank strings, unrecognized fields, and fractional rial amounts', async () => {
    const dto = plainToInstance(CreatePropertyDto, { ...validProperty, title: '   ', salePrice: '۱۲٫۵', unknownTenantId: 'tenant-from-client' });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['title', 'salePrice', 'unknownTenantId']));
    const nullDto = plainToInstance(CreatePropertyDto, { ...validProperty, salePrice: null });
    expect((await validate(nullDto)).some((error) => error.property === 'salePrice')).toBe(true);
  });

  it('accepts only explicit boolean archive filters', async () => {
    const good = plainToInstance(ListPropertiesQuery, { includeArchived: 'true' });
    const bad = plainToInstance(ListPropertiesQuery, { includeArchived: 'yes' });
    expect(good.includeArchived).toBe(true);
    expect(await validate(good)).toHaveLength(0);
    expect((await validate(bad)).some((error) => error.property === 'includeArchived')).toBe(true);
  });
});
