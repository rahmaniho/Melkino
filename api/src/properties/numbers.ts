const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

export function normalizeDigits(value: unknown): unknown {
  if (typeof value !== 'string' && typeof value !== 'number') return value;
  return String(value)
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[٬,\s]/g, '')
    .replace(/[٫]/g, '.');
}

export function isUnsignedInteger(value: string): boolean {
  return /^\d{1,20}$/.test(value);
}
