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
import { pickColumn, pickOptionalColumn } from '../utils/fileParser';

const PREFERRED = {
  sales: {
    dateColumn: ['订单成交时间'],
    amountColumn: ['商家实收金额(元)', '商家实收金额（元）', '商家实收金额'],
    qtyColumn: ['商品数量(件)', '商品数量（件）', '商品数量'],
    skuColumn: ['商品'],
    statusColumn: ['订单状态'],
    orderIdColumn: ['订单号']
  },
  purchase: {
    skuColumn: ['商品'],
    priceColumn: ['进货价']
  }
};

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

export function buildSalesMapping(columns) {
  return {
    dateColumn: pickWithPreferred(columns, PREFERRED.sales.dateColumn, SALE_DATE_KEYS),
    amountColumn: pickWithPreferred(columns, PREFERRED.sales.amountColumn, SALE_AMOUNT_KEYS),
    qtyColumn: pickWithPreferred(columns, PREFERRED.sales.qtyColumn, SALE_QTY_KEYS),
    skuColumn: pickWithPreferred(columns, PREFERRED.sales.skuColumn, SALE_SKU_KEYS),
    statusColumn: pickWithPreferred(columns, PREFERRED.sales.statusColumn, SALE_STATUS_KEYS, true),
    orderIdColumn: pickWithPreferred(columns, PREFERRED.sales.orderIdColumn, SALE_ORDER_ID_KEYS, true)
  };
}

export function buildPurchaseMapping(columns) {
  return {
    skuColumn: pickWithPreferred(columns, PREFERRED.purchase.skuColumn, PURCHASE_SKU_KEYS),
    priceColumn: pickWithPreferred(columns, PREFERRED.purchase.priceColumn, PURCHASE_PRICE_KEYS)
  };
}
