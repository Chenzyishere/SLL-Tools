import {
  PURCHASE_PRICE_KEYS,
  PURCHASE_SKU_KEYS,
  SALE_AMOUNT_KEYS,
  SALE_DATE_KEYS,
  SALE_ORDER_ID_KEYS,
  SALE_QTY_KEYS,
  SALE_SKU_KEYS,
  SALE_STATUS_KEYS
} from './columnHints';
import { DEFAULT_PLATFORM_ID, PLATFORM_PRESETS } from './platformPresets';
import { pickColumn, pickOptionalColumn } from '../utils/fileParser';

function normalizeHeader(value) {
  return String(value ?? '').replace(/\s/g, '').trim();
}

function pickPreferredExact(columns, preferredNames) {
  const normalizedMap = new Map(columns.map((col) => [normalizeHeader(col), col]));
  for (const name of preferredNames) {
    const matched = normalizedMap.get(normalizeHeader(name));
    if (matched) return matched;
  }
  return '';
}

function pickWithPreferred(columns, preferredNames, keywords, optional = false) {
  const exact = pickPreferredExact(columns, preferredNames);
  if (exact) return exact;
  return optional ? pickOptionalColumn(columns, keywords) : pickColumn(columns, keywords);
}

function getPreset(platformId) {
  return PLATFORM_PRESETS[platformId] || PLATFORM_PRESETS[DEFAULT_PLATFORM_ID];
}

export function buildSalesMapping(columns, platformId = DEFAULT_PLATFORM_ID) {
  const preferred = getPreset(platformId).sales;

  return {
    dateColumn: pickWithPreferred(columns, preferred.dateColumn, SALE_DATE_KEYS),
    amountColumn: pickWithPreferred(columns, preferred.amountColumn, SALE_AMOUNT_KEYS),
    qtyColumn: pickWithPreferred(columns, preferred.qtyColumn, SALE_QTY_KEYS),
    skuColumn: pickWithPreferred(columns, preferred.skuColumn, SALE_SKU_KEYS),
    statusColumn: pickWithPreferred(columns, preferred.statusColumn, SALE_STATUS_KEYS, true),
    orderIdColumn: pickWithPreferred(columns, preferred.orderIdColumn, SALE_ORDER_ID_KEYS, true)
  };
}

export function buildPurchaseMapping(columns, platformId = DEFAULT_PLATFORM_ID) {
  const preferred = getPreset(platformId).purchase;

  return {
    skuColumn: pickWithPreferred(columns, preferred.skuColumn, PURCHASE_SKU_KEYS),
    priceColumn: pickWithPreferred(columns, preferred.priceColumn, PURCHASE_PRICE_KEYS)
  };
}
