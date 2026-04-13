export const SALE_DATE_KEYS = ['订单成交时间', '成交时间', '下单时间', '支付时间', '日期', '时间'];
export const SALE_AMOUNT_KEYS = ['商家实收金额', '实收金额', '到账金额', '收入', '应收', '金额'];
export const SALE_QTY_KEYS = ['商品数量', '数量', '件数', '购买数量'];
export const SALE_SKU_KEYS = ['商家编码-商品维度', '商家编码-规格维度', 'SKU货号', '货号', 'skuID', '商品id', 'spuID'];
export const SALE_STATUS_KEYS = ['订单状态', '状态', '售后状态'];
export const SALE_ORDER_ID_KEYS = ['订单号', '子订单号', '订单ID', '订单id'];

export const PURCHASE_SKU_KEYS = ['商品编码', 'SKU货号', '货号', 'skuID', '商品id', 'spuID', '商家编码-商品维度', '商家编码-规格维度'];
export const PURCHASE_PRICE_KEYS = ['进货价', '采购价', '成本价', '单价', '供货价', '价格'];

export const SALES_FIELDS = [
  { key: 'dateColumn', label: '日期列' },
  { key: 'amountColumn', label: '收入金额列' },
  { key: 'qtyColumn', label: '销售数量列' },
  { key: 'skuColumn', label: '商品编码列' },
  { key: 'statusColumn', label: '订单状态列' },
  { key: 'orderIdColumn', label: '订单号列' }
];

export const PURCHASE_FIELDS = [
  { key: 'skuColumn', label: '商品编码列' },
  { key: 'priceColumn', label: '进货单价列' }
];

export const SALES_HINT_TEXT = `日期(${SALE_DATE_KEYS.join(' / ')})，收入(${SALE_AMOUNT_KEYS.join(' / ')})，数量(${SALE_QTY_KEYS.join(' / ')})，编码(${SALE_SKU_KEYS.join(' / ')})，状态(${SALE_STATUS_KEYS.join(' / ')})，订单号(${SALE_ORDER_ID_KEYS.join(' / ')})`;
export const PURCHASE_HINT_TEXT = `编码(${PURCHASE_SKU_KEYS.join(' / ')})，进货价(${PURCHASE_PRICE_KEYS.join(' / ')})`;
