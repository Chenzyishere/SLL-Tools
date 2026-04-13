import Papa from 'papaparse';
import * as XLSX from 'xlsx';

function normalizeRows(rows) {
  return rows.map((row) => {
    const normalized = {};

    for (const [key, value] of Object.entries(row || {})) {
      const cleanKey = String(key ?? '').replace(/^\uFEFF/, '').trim();
      normalized[cleanKey] = typeof value === 'string' ? value.trim() : value;
    }

    return normalized;
  });
}

function decodeCsvBuffer(arrayBuffer) {
  const encodings = ['utf-8', 'gb18030', 'gbk'];
  let bestText = '';
  let bestScore = Number.POSITIVE_INFINITY;

  for (const encoding of encodings) {
    try {
      const text = new TextDecoder(encoding).decode(arrayBuffer);
      const score = (text.match(/\uFFFD/g) || []).length;

      if (score < bestScore) {
        bestScore = score;
        bestText = text;
      }

      if (score === 0) break;
    } catch (_) {
      // Skip unsupported decoder.
    }
  }

  return bestText;
}

async function parseCSVFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const csvText = decodeCsvBuffer(arrayBuffer);

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors?.length) {
          reject(new Error(result.errors[0].message || 'CSV 解析失败'));
          return;
        }

        resolve(normalizeRows(result.data || []));
      },
      error: (error) => reject(error)
    });
  });
}

async function parseExcelFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, raw: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return normalizeRows(XLSX.utils.sheet_to_json(firstSheet, { defval: '' }));
}

export async function parseFile(file) {
  const lower = file.name.toLowerCase();

  if (lower.endsWith('.csv')) return parseCSVFile(file);
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return parseExcelFile(file);

  throw new Error('仅支持 CSV / XLSX / XLS');
}

export function pickColumn(columns, keywords) {
  const cleanColumns = columns.map((c) => String(c || '').trim());

  for (const key of keywords) {
    const found = cleanColumns.find((c) => c.includes(key));
    if (found) return found;
  }

  return cleanColumns[0] || '';
}

export function pickOptionalColumn(columns, keywords) {
  const cleanColumns = columns.map((c) => String(c || '').trim());

  for (const key of keywords) {
    const found = cleanColumns.find((c) => c.includes(key));
    if (found) return found;
  }

  return '';
}
