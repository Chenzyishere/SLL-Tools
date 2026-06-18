export const PLATFORM_PRESETS = {
  pinduoduo: {
    id: 'pinduoduo',
    name: '拼多多',
    description: '适用于拼多多商家订单导出表',
    costDefaults: {
      baseShippingFee: 3.8,
      monthlyWeightFee: 0,
      consumerExperienceFee: 2.4,
      techServiceRate: 0.006,
      inboundWarehouseShippingFee: 0,
      outboundWarehouseShippingFee: 0
    },
    warehouseFeesEnabled: false,
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
  },
  dewu: {
    id: 'dewu',
    name: '得物',
    description: '适用于得物订单导出表',
    costDefaults: {
      baseShippingFee: 0,
      monthlyWeightFee: 0,
      consumerExperienceFee: 0,
      techServiceRate: 0,
      inboundWarehouseShippingFee: 0,
      outboundWarehouseShippingFee: 0
    },
    warehouseFeesEnabled: true,
    sales: {
      dateColumn: ['买家支付时间', '买家下单时间'],
      amountColumn: ['预计收入金额（元）', '预计收入金额(元)', '出价金额（元）', '出价金额(元)'],
      qtyColumn: ['数量'],
      skuColumn: ['货号', 'SKU货号', '商品编码', '商品名称'],
      statusColumn: ['订单状态'],
      orderIdColumn: ['订单号']
    },
    purchase: {
      skuColumn: ['货号', 'SKU货号', '商品编码', '商品', '商品名称'],
      priceColumn: ['进货价']
    }
  },
  manual: {
    id: 'manual',
    name: '手动输入',
    description: '手动录入订单数据',
    costDefaults: {
      baseShippingFee: 0,
      monthlyWeightFee: 0,
      consumerExperienceFee: 0,
      techServiceRate: 0,
      inboundWarehouseShippingFee: 0,
      outboundWarehouseShippingFee: 0
    },
    warehouseFeesEnabled: false,
    sales: {
      dateColumn: ['日期'],
      amountColumn: ['金额'],
      qtyColumn: ['数量'],
      skuColumn: [],
      statusColumn: ['状态'],
      orderIdColumn: []
    },
    purchase: {
      skuColumn: ['货号', 'SKU货号', '商品编码', '商品', '商品名称'],
      priceColumn: ['进货价']
    }
  }
};

export const DEFAULT_PLATFORM_ID = 'pinduoduo';

export function getPlatformCostDefaults(platformId = DEFAULT_PLATFORM_ID) {
  return {
    ...PLATFORM_PRESETS[DEFAULT_PLATFORM_ID].costDefaults,
    ...(PLATFORM_PRESETS[platformId]?.costDefaults || {})
  };
}
