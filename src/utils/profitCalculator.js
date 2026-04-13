import { normalizeKey, parseDate, toNumber } from './valueUtils';

const PRODUCT_NAME_KEYS = ['商品', '商品名称', '商品名', '货号', 'SKU货号'];

function pickProductName(row) {
  for (const key of PRODUCT_NAME_KEYS) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function toList(map, { includeCost }) {
  return Array.from(map.values())
    .map((item) => ({
      sku: item.sku,
      name: item.name,
      orderCount: item.orderCount,
      totalQty: item.totalQty,
      totalRevenue: item.totalRevenue,
      totalCost: includeCost ? item.totalCost : undefined,
      purchasePrice: includeCost ? item.purchasePrice : undefined
    }))
    .sort((a, b) => b.orderCount - a.orderCount || b.totalQty - a.totalQty);
}

function normalizeStatus(rawStatus) {
  return String(rawStatus ?? '').replace(/\s/g, '').trim();
}

function classifyStatus(statusText) {
  const text = normalizeStatus(statusText);

  const isCanceled = text.includes('已取消') || text.includes('未发货');
  const isRefundSuccess = text.includes('退款成功');
  const isReceived = text.includes('已收货');
  const isShipped = text.includes('已发货');
  const isPending = isShipped && text.includes('待收货');

  const invalid = isCanceled || (isRefundSuccess && !isReceived && !isShipped);
  const shippingEligible = isReceived || (isShipped && isRefundSuccess);

  return {
    normalized: text,
    invalid,
    pending: isPending,
    shippingEligible,
    receivedEligible: isReceived
  };
}

function getOrderKey(row, orderIdColumn, fallbackIndex) {
  const rawOrderId = orderIdColumn ? row[orderIdColumn] : undefined;
  const orderId = String(rawOrderId ?? '').trim();
  if (orderId) return orderId;
  return `ROW-${fallbackIndex + 1}`;
}

function createOrderSummary(orderId, firstSeenIndex) {
  return {
    orderId,
    firstSeenIndex,
    statuses: new Set(),
    effectiveLineCount: 0,
    pendingLineCount: 0,
    invalidLineCount: 0,
    grossRevenue: 0,
    refundAmount: 0,
    netRevenue: 0,
    productCost: 0,
    shippingCost: 0,
    experienceFee: 0,
    techServiceFee: 0,
    pendingAmount: 0,
    invalidAmount: 0,
    shippingEligible: false,
    receivedEligible: false
  };
}

function toOrderProfitRows(orderMap) {
  return Array.from(orderMap.values())
    .map((order) => {
      let category = '已入账';
      let note = '';

      if (order.effectiveLineCount === 0 && order.pendingLineCount > 0 && order.invalidLineCount === 0) {
        category = '待入账';
        note = `待入账金额 ${order.pendingAmount.toFixed(2)}`;
      } else if (order.effectiveLineCount === 0 && order.invalidLineCount > 0 && order.pendingLineCount === 0) {
        category = '无效';
        note = `无效金额 ${order.invalidAmount.toFixed(2)}`;
      } else if (order.effectiveLineCount === 0 && order.pendingLineCount > 0 && order.invalidLineCount > 0) {
        category = '待入账/无效';
        note = `待入账 ${order.pendingAmount.toFixed(2)}，无效 ${order.invalidAmount.toFixed(2)}`;
      }

      return {
        orderId: order.orderId,
        category,
        statuses: Array.from(order.statuses).filter(Boolean).join(' | ') || '-',
        grossRevenue: order.grossRevenue,
        refundAmount: order.refundAmount,
        netRevenue: order.netRevenue,
        productCost: order.productCost,
        shippingCost: order.shippingCost,
        experienceFee: order.experienceFee,
        techServiceFee: order.techServiceFee,
        profit: order.netRevenue - order.productCost - order.shippingCost - order.experienceFee - order.techServiceFee,
        note,
        editableRefund: order.effectiveLineCount > 0,
        firstSeenIndex: order.firstSeenIndex
      };
    })
    .sort((a, b) => {
      if (a.category !== b.category) {
        const rank = { '已入账': 0, '待入账': 1, 无效: 2, '待入账/无效': 3 };
        return (rank[a.category] ?? 9) - (rank[b.category] ?? 9);
      }
      return a.firstSeenIndex - b.firstSeenIndex;
    });
}

function toPendingOrderRows(orderMap) {
  return Array.from(orderMap.values())
    .filter((order) => order.pendingLineCount > 0)
    .map((order) => {
      let note = '';
      if (order.effectiveLineCount > 0) note = '含已入账明细，待入账部分未计入利润';
      if (order.invalidLineCount > 0) note = note ? `${note}；同时含无效明细` : '同时含无效明细';

      return {
        orderId: order.orderId,
        statuses: Array.from(order.statuses).filter(Boolean).join(' | ') || '-',
        pendingAmount: order.pendingAmount,
        pendingLineCount: order.pendingLineCount,
        note
      };
    })
    .sort((a, b) => b.pendingAmount - a.pendingAmount);
}

export function calcProfitByPurchasePrice(
  salesRows,
  purchaseRows,
  salesMapping,
  purchaseMapping,
  yearMonth,
  costSettings,
  orderRefundOverrides
) {
  if (!yearMonth) {
    return {
      revenue: 0,
      grossRevenue: 0,
      refundTotal: 0,
      cost: 0,
      productCost: 0,
      shippingCost: 0,
      experienceFeeTotal: 0,
      techServiceFeeTotal: 0,
      shippingOrderCount: 0,
      weightFee: 0,
      profit: 0,
      salesCount: 0,
      matchedCount: 0,
      unmatchedCount: 0,
      invalidCount: 0,
      pendingCount: 0,
      pendingAmount: 0,
      refundReviewCount: 0,
      refundReviewTotal: 0,
      filteredByStatus: 0,
      matchedProducts: [],
      unmatchedProducts: [],
      orderProfitRows: [],
      pendingOrderRows: [],
      orderRefundEditedCount: 0
    };
  }

  const [year, month] = yearMonth.split('-').map(Number);
  const purchaseMap = new Map();

  for (const row of purchaseRows) {
    const sku = normalizeKey(row[purchaseMapping.skuColumn]);
    const price = toNumber(row[purchaseMapping.priceColumn]);
    if (!sku || Number.isNaN(price)) continue;
    if (!purchaseMap.has(sku)) purchaseMap.set(sku, price);
  }

  let grossRevenue = 0;
  let revenue = 0;
  let productCost = 0;
  let salesCount = 0;
  let matchedCount = 0;
  let unmatchedCount = 0;
  let invalidCount = 0;
  let pendingCount = 0;
  let pendingAmount = 0;

  const matchedMap = new Map();
  const unmatchedMap = new Map();
  const orderMap = new Map();

  const baseShippingFee = Number(costSettings?.baseShippingFee) || 0;
  const weightFee = Number(costSettings?.monthlyWeightFee) || 0;
  const consumerExperienceFee = Number(costSettings?.consumerExperienceFee) || 0;
  const techServiceRate = Number(costSettings?.techServiceRate) || 0;

  for (let index = 0; index < salesRows.length; index += 1) {
    const row = salesRows[index];

    const date = parseDate(row[salesMapping.dateColumn]);
    const amount = toNumber(row[salesMapping.amountColumn]);
    if (!date || Number.isNaN(amount)) continue;
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month) continue;

    const statusInfo = classifyStatus(row[salesMapping.statusColumn]);
    const orderKey = getOrderKey(row, salesMapping.orderIdColumn, index);

    if (!orderMap.has(orderKey)) {
      orderMap.set(orderKey, createOrderSummary(orderKey, index));
    }
    const order = orderMap.get(orderKey);
    order.statuses.add(statusInfo.normalized);

    if (statusInfo.invalid) {
      invalidCount += 1;
      order.invalidLineCount += 1;
      order.invalidAmount += amount;
      continue;
    }

    if (statusInfo.pending) {
      pendingCount += 1;
      pendingAmount += amount;
      order.pendingLineCount += 1;
      order.pendingAmount += amount;
      continue;
    }

    salesCount += 1;
    grossRevenue += amount;

    order.effectiveLineCount += 1;
    order.grossRevenue += amount;

    const rawSku = row[salesMapping.skuColumn];
    const sku = normalizeKey(rawSku);
    const skuLabel = String(rawSku ?? '').trim() || '(空编码)';

    let qty = toNumber(row[salesMapping.qtyColumn]);
    if (Number.isNaN(qty) || qty <= 0) qty = 1;

    const name = pickProductName(row);
    const purchasePrice = purchaseMap.get(sku);

    if (statusInfo.shippingEligible) order.shippingEligible = true;
    if (statusInfo.receivedEligible) order.receivedEligible = true;

    if (!sku || purchasePrice === undefined || Number.isNaN(purchasePrice)) {
      unmatchedCount += 1;
      const unmatchedKey = sku || `__empty__${name || 'unknown'}`;

      if (!unmatchedMap.has(unmatchedKey)) {
        unmatchedMap.set(unmatchedKey, {
          sku: skuLabel,
          name,
          orderCount: 0,
          totalQty: 0,
          totalRevenue: 0
        });
      }

      const item = unmatchedMap.get(unmatchedKey);
      item.orderCount += 1;
      item.totalQty += qty;
      item.totalRevenue += amount;
      continue;
    }

    matchedCount += 1;
    const lineCost = purchasePrice * qty;
    productCost += lineCost;
    order.productCost += lineCost;

    if (!matchedMap.has(sku)) {
      matchedMap.set(sku, {
        sku: skuLabel,
        name,
        purchasePrice,
        orderCount: 0,
        totalQty: 0,
        totalRevenue: 0,
        totalCost: 0
      });
    }

    const item = matchedMap.get(sku);
    item.orderCount += 1;
    item.totalQty += qty;
    item.totalRevenue += amount;
    item.totalCost += lineCost;
  }

  let shippingOrderCount = 0;
  let shippingCost = 0;
  let refundTotal = 0;
  let orderRefundEditedCount = 0;
  let experienceFeeTotal = 0;
  let techServiceFeeTotal = 0;

  for (const order of orderMap.values()) {
    if (order.effectiveLineCount > 0 && order.shippingEligible) {
      order.shippingCost = baseShippingFee;
      shippingOrderCount += 1;
      shippingCost += baseShippingFee;
    }

    const overrideRaw = orderRefundOverrides?.[order.orderId];
    const override = Number(overrideRaw);
    order.refundAmount = !Number.isNaN(override) && override > 0 ? override : 0;

    if (order.effectiveLineCount > 0) {
      order.netRevenue = order.grossRevenue - order.refundAmount;
      revenue += order.netRevenue;
      refundTotal += order.refundAmount;
      if (order.refundAmount > 0) orderRefundEditedCount += 1;

      if (order.receivedEligible) {
        order.experienceFee = consumerExperienceFee;
        order.techServiceFee = order.netRevenue * techServiceRate;
        experienceFeeTotal += order.experienceFee;
        techServiceFeeTotal += order.techServiceFee;
      }
    } else {
      order.netRevenue = 0;
      order.refundAmount = 0;
    }
  }

  const cost = productCost + shippingCost + experienceFeeTotal + techServiceFeeTotal + weightFee;

  return {
    revenue,
    grossRevenue,
    refundTotal,
    cost,
    productCost,
    shippingCost,
    experienceFeeTotal,
    techServiceFeeTotal,
    shippingOrderCount,
    weightFee,
    profit: revenue - cost,
    salesCount,
    matchedCount,
    unmatchedCount,
    invalidCount,
    pendingCount,
    pendingAmount,
    refundReviewCount: orderRefundEditedCount,
    refundReviewTotal: refundTotal,
    filteredByStatus: invalidCount,
    matchedProducts: toList(matchedMap, { includeCost: true }),
    unmatchedProducts: toList(unmatchedMap, { includeCost: false }),
    orderProfitRows: toOrderProfitRows(orderMap),
    pendingOrderRows: toPendingOrderRows(orderMap),
    orderRefundEditedCount
  };
}
