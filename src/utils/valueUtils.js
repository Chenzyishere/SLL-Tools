import * as XLSX from 'xlsx';

export function toNumber(value) {
  if (value === null || value === undefined) return NaN;
  if (typeof value === 'number') return value;

  const cleaned = String(value).replace(/,/g, '').replace(/\s/g, '');
  return Number(cleaned);
}

export function parseDate(value) {
  if (!value && value !== 0) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0);
    }
  }

  const text = String(value).trim();
  if (!text) return null;

  const normalized = text.replace(/[.\/]/g, '-').replace('T', ' ').replace(/Z$/, '');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeKey(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function getDefaultMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
