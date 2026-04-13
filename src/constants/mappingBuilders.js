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

export function buildSalesMapping(columns) {
  return {
    dateColumn: pickColumn(columns, SALE_DATE_KEYS),
    amountColumn: pickColumn(columns, SALE_AMOUNT_KEYS),
    qtyColumn: pickColumn(columns, SALE_QTY_KEYS),
    skuColumn: pickColumn(columns, SALE_SKU_KEYS),
    statusColumn: pickOptionalColumn(columns, SALE_STATUS_KEYS),
    orderIdColumn: pickOptionalColumn(columns, SALE_ORDER_ID_KEYS)
  };
}

export function buildPurchaseMapping(columns) {
  return {
    skuColumn: pickColumn(columns, PURCHASE_SKU_KEYS),
    priceColumn: pickColumn(columns, PURCHASE_PRICE_KEYS)
  };
}
