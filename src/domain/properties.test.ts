import { describe, expect, it } from 'vitest';
import {
  archiveProperty,
  createProperty,
  exportPropertiesCsv,
  initialProperties,
  readProperties,
  writeProperties,
  updateProperty,
  type Property,
} from './properties';

const draft = { title: '  خانه دوبلکس  ', area: '  الهیه  ', size: '۲۲۰', beds: '۳', price: '۳۲٫۵' };

describe('property file operations', () => {
  it('creates a normalized property with the next unique code', () => {
    const created = createProperty(draft, initialProperties, new Date('2026-11-22T10:00:00Z'));
    expect(created.code).toBe('ML-2482');
    expect(created.title).toBe('خانه دوبلکس');
    expect(created.area).toBe('الهیه');
    expect(created.size).toBe(220);
    expect(created.beds).toBe(3);
    expect(created.price).toContain('۳۲٫۵');
  });

  it('rejects missing and invalid property values instead of saving partial data', () => {
    expect(() => createProperty({ ...draft, size: '۰' }, initialProperties)).toThrow(/متراژ/);
    expect(() => createProperty({ ...draft, price: '' }, initialProperties)).toThrow(/قیمت/);
    expect(() => createProperty({ ...draft, title: '  ' }, initialProperties)).toThrow(/عنوان/);
  });

  it('archives and restores a record without losing its previous status', () => {
    const source = initialProperties[1];
    const archived = archiveProperty(initialProperties, source.code, true);
    expect(archived[1].status).toBe('بایگانی');
    expect(archived[1].archivedFromStatus).toBe('بازدید');
    const restored = archiveProperty(archived, source.code, false);
    expect(restored[1].status).toBe('بازدید');
    expect(restored[1].archivedFromStatus).toBeUndefined();
    expect(initialProperties[1].status).toBe('بازدید');
  });

  it('updates only the selected record and protects its code', () => {
    const updated = updateProperty(initialProperties, 'ML-2481', { title: 'عنوان اصلاح‌شده', code: 'ML-9999' } as Partial<Property>);
    expect(updated[0].title).toBe('عنوان اصلاح‌شده');
    expect(updated[0].code).toBe('ML-2481');
    expect(initialProperties[0].title).not.toBe('عنوان اصلاح‌شده');
  });

  it('reads persisted JSON defensively and falls back on corrupt data', () => {
    const storage = { getItem: () => '{broken' } as Pick<Storage, 'getItem'>;
    expect(readProperties(storage, initialProperties)).toEqual(initialProperties);
  });

  it('persists the complete updated list under the application storage key', () => {
    let storedKey = '';
    let storedValue = '';
    const storage = { setItem: (key: string, value: string) => { storedKey = key; storedValue = value; } } as Pick<Storage, 'setItem'>;
    writeProperties(storage, initialProperties);
    expect(storedKey).toBe('melkino-properties');
    expect(JSON.parse(storedValue)).toEqual(initialProperties);
  });

  it('exports a UTF-8 BOM CSV and escapes Persian values safely', () => {
    const csv = exportPropertiesCsv([{ ...initialProperties[0], title: 'واحد، «ویژه»' }]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"کد فایل","عنوان ملک"');
    expect(csv).toContain('"واحد، «ویژه»"');
    const formulaCsv = exportPropertiesCsv([{ ...initialProperties[0], title: '=HYPERLINK("https://evil.invalid")' }]);
    expect(formulaCsv).toContain("'=HYPERLINK");
  });
});
