import { useEffect, useMemo, useState } from 'react';
import { buildPurchaseMapping, buildSalesMapping } from '../constants/mappingBuilders';
import { DEFAULT_PLATFORM_ID, getPlatformCostDefaults, PLATFORM_PRESETS } from '../constants/platformPresets';
import { parseFile } from '../utils/fileParser';
import { calcProfitByPurchasePrice } from '../utils/profitCalculator';
import { clearPersistedState, loadPersistedState, savePersistedState } from '../utils/storage';
import { getDefaultMonth } from '../utils/valueUtils';

const EMPTY_SALES_MAPPING = {
  dateColumn: '',
  amountColumn: '',
  qtyColumn: '',
  skuColumn: '',
  statusColumn: '',
  orderIdColumn: ''
};

const EMPTY_PURCHASE_MAPPING = {
  skuColumn: '',
  priceColumn: ''
};

const DEFAULT_COST_SETTINGS = getPlatformCostDefaults(DEFAULT_PLATFORM_ID);

function createPlatformData(platformId) {
  return {
    salesRows: [],
    salesFileNames: [],
    salesMapping: { ...EMPTY_SALES_MAPPING },
    costSettings: { ...getPlatformCostDefaults(platformId) },
    orderRefundOverrides: {},
    orderReturnOverrides: {}
  };
}

export function useProfitPlatform() {
  const [activePlatformId, setActivePlatformId] = useState(() => {
    const saved = loadPersistedState();
    return saved?.activePlatformId || DEFAULT_PLATFORM_ID;
  });
  const [month, setMonth] = useState(() => {
    const saved = loadPersistedState();
    return saved?.month || getDefaultMonth();
  });
  const [purchaseRows, setPurchaseRows] = useState(() => {
    const saved = loadPersistedState();
    return saved?.purchaseRows || [];
  });
  const [purchaseFileNames, setPurchaseFileNames] = useState(() => {
    const saved = loadPersistedState();
    return saved?.purchaseFileNames || [];
  });
  const [purchaseMapping, setPurchaseMapping] = useState(() => {
    const saved = loadPersistedState();
    return saved?.purchaseMapping || EMPTY_PURCHASE_MAPPING;
  });
  const [platformData, setPlatformData] = useState(() => {
    const saved = loadPersistedState();
    if (saved?.platformData) return saved.platformData;
    return {
      pinduoduo: createPlatformData('pinduoduo'),
      dewu: createPlatformData('dewu')
    };
  });
  const [error, setError] = useState('');

  const currentPlatformData = platformData[activePlatformId];

  useEffect(() => {
    if (!currentPlatformData.costSettings) {
      setPlatformData((prev) => ({
        ...prev,
        [activePlatformId]: {
          ...prev[activePlatformId],
          costSettings: { ...getPlatformCostDefaults(activePlatformId) }
        }
      }));
    }
  }, [activePlatformId]);

  useEffect(() => {
    const salesColumns = currentPlatformData.salesRows[0] ? Object.keys(currentPlatformData.salesRows[0]) : [];
    if (salesColumns.length) {
      const newMapping = buildSalesMapping(salesColumns, activePlatformId);
      setPlatformData((prev) => ({
        ...prev,
        [activePlatformId]: {
          ...prev[activePlatformId],
          salesMapping: newMapping
        }
      }));
    }
  }, [activePlatformId, currentPlatformData.salesRows]);

  useEffect(() => {
    const purchaseColumns = purchaseRows[0] ? Object.keys(purchaseRows[0]) : [];
    if (purchaseColumns.length) {
      setPurchaseMapping(buildPurchaseMapping(purchaseColumns, DEFAULT_PLATFORM_ID));
    }
  }, [purchaseRows]);

  // Persist state to localStorage on every change.
  useEffect(() => {
    savePersistedState({
      activePlatformId,
      month,
      platformData,
      purchaseRows,
      purchaseFileNames,
      purchaseMapping
    });
  }, [activePlatformId, month, platformData, purchaseRows, purchaseFileNames, purchaseMapping]);

  function clearData() {
    clearPersistedState();
    setActivePlatformId(DEFAULT_PLATFORM_ID);
    setMonth(getDefaultMonth());
    setPlatformData({
      pinduoduo: createPlatformData('pinduoduo'),
      dewu: createPlatformData('dewu')
    });
    setPurchaseRows([]);
    setPurchaseFileNames([]);
    setPurchaseMapping(EMPTY_PURCHASE_MAPPING);
  }

  async function handleSalesUpload(files) {
    try {
      setError('');
      const fileList = Array.from(files || []);
      const parsedFiles = await Promise.all(fileList.map((file) => parseFile(file)));
      const rows = parsedFiles.flat();
      const columns = rows[0] ? Object.keys(rows[0]) : [];

      setPlatformData((prev) => ({
        ...prev,
        [activePlatformId]: {
          ...prev[activePlatformId],
          salesRows: rows,
          salesFileNames: fileList.map((file) => file.name),
          salesMapping: buildSalesMapping(columns, activePlatformId),
          orderRefundOverrides: {},
          orderReturnOverrides: {}
        }
      }));
    } catch (err) {
      setError(`${PLATFORM_PRESETS[activePlatformId]?.name}订单表解析失败：${err.message || err}`);
    }
  }

  async function handlePurchaseUpload(file) {
    try {
      setError('');
      const rows = await parseFile(file);
      const columns = rows[0] ? Object.keys(rows[0]) : [];

      setPurchaseRows(rows);
      setPurchaseFileNames([file.name]);
      setPurchaseMapping(buildPurchaseMapping(columns, activePlatformId));
    } catch (err) {
      setError(`进货表解析失败：${err.message || err}`);
    }
  }

  function updateOrderRefundOverride(orderId, rawValue) {
    setPlatformData((prev) => {
      const overrides = { ...prev[activePlatformId].orderRefundOverrides };
      const text = String(rawValue ?? '').trim();

      if (!text) {
        delete overrides[orderId];
      } else {
        const numeric = Number(text);
        if (!Number.isNaN(numeric) && numeric >= 0) {
          overrides[orderId] = numeric;
        }
      }

      return {
        ...prev,
        [activePlatformId]: {
          ...prev[activePlatformId],
          orderRefundOverrides: overrides
        }
      };
    });
  }

  function updateOrderReturnOverride(orderId, value) {
    setPlatformData((prev) => {
      const overrides = { ...prev[activePlatformId].orderReturnOverrides };

      if (value) {
        overrides[orderId] = true;
      } else {
        delete overrides[orderId];
      }

      return {
        ...prev,
        [activePlatformId]: {
          ...prev[activePlatformId],
          orderReturnOverrides: overrides
        }
      };
    });
  }

  function updateCostSetting(key, value) {
    setPlatformData((prev) => ({
      ...prev,
      [activePlatformId]: {
        ...prev[activePlatformId],
        costSettings: {
          ...prev[activePlatformId].costSettings,
          [key]: Number(value)
        }
      }
    }));
  }

  const activeStats = useMemo(
    () =>
      calcProfitByPurchasePrice(
        currentPlatformData.salesRows,
        purchaseRows,
        currentPlatformData.salesMapping,
        purchaseMapping,
        month,
        currentPlatformData.costSettings || DEFAULT_COST_SETTINGS,
        currentPlatformData.orderRefundOverrides,
        currentPlatformData.orderReturnOverrides
      ),
    [currentPlatformData.salesRows, purchaseRows, currentPlatformData.salesMapping, purchaseMapping, month, currentPlatformData.costSettings, currentPlatformData.orderRefundOverrides, currentPlatformData.orderReturnOverrides]
  );

  const combinedStats = useMemo(() => {
    const pddStats = calcProfitByPurchasePrice(
      platformData.pinduoduo.salesRows,
      purchaseRows,
      platformData.pinduoduo.salesMapping,
      purchaseMapping,
      month,
      platformData.pinduoduo.costSettings || getPlatformCostDefaults('pinduoduo'),
      platformData.pinduoduo.orderRefundOverrides,
      platformData.pinduoduo.orderReturnOverrides
    );

    const dewuStats = calcProfitByPurchasePrice(
      platformData.dewu.salesRows,
      purchaseRows,
      platformData.dewu.salesMapping,
      purchaseMapping,
      month,
      platformData.dewu.costSettings || getPlatformCostDefaults('dewu'),
      platformData.dewu.orderRefundOverrides,
      platformData.dewu.orderReturnOverrides
    );

    return {
      pinduoduo: pddStats,
      dewu: dewuStats,
      combined: {
        revenue: pddStats.revenue + dewuStats.revenue,
        grossRevenue: pddStats.grossRevenue + dewuStats.grossRevenue,
        refundTotal: pddStats.refundTotal + dewuStats.refundTotal,
        cost: pddStats.cost + dewuStats.cost,
        productCost: pddStats.productCost + dewuStats.productCost,
        shippingCost: pddStats.shippingCost + dewuStats.shippingCost,
        experienceFeeTotal: (pddStats.experienceFeeTotal || 0) + (dewuStats.experienceFeeTotal || 0),
        techServiceFeeTotal: (pddStats.techServiceFeeTotal || 0) + (dewuStats.techServiceFeeTotal || 0),
        shippingOrderCount: pddStats.shippingOrderCount + dewuStats.shippingOrderCount,
        weightFee: pddStats.weightFee + dewuStats.weightFee,
        warehouseFeeTotal: (pddStats.warehouseFeeTotal || 0) + (dewuStats.warehouseFeeTotal || 0),
        inboundWarehouseShippingFee: (pddStats.inboundWarehouseShippingFee || 0) + (dewuStats.inboundWarehouseShippingFee || 0),
        outboundWarehouseShippingFee: (pddStats.outboundWarehouseShippingFee || 0) + (dewuStats.outboundWarehouseShippingFee || 0),
        profit: pddStats.profit + dewuStats.profit,
        salesCount: pddStats.salesCount + dewuStats.salesCount,
        matchedCount: pddStats.matchedCount + dewuStats.matchedCount,
        unmatchedCount: pddStats.unmatchedCount + dewuStats.unmatchedCount,
        invalidCount: pddStats.invalidCount + dewuStats.invalidCount,
        pendingCount: pddStats.pendingCount + dewuStats.pendingCount,
        pendingAmount: pddStats.pendingAmount + dewuStats.pendingAmount,
        refundReviewCount: pddStats.refundReviewCount + dewuStats.refundReviewCount,
        refundReviewTotal: pddStats.refundReviewTotal + dewuStats.refundReviewTotal,
        returnOrderCount: (pddStats.returnOrderCount || 0) + (dewuStats.returnOrderCount || 0),
        returnShippingCost: (pddStats.returnShippingCost || 0) + (dewuStats.returnShippingCost || 0),
        filteredByStatus: pddStats.filteredByStatus + dewuStats.filteredByStatus,
        orderRefundEditedCount: pddStats.orderRefundEditedCount + dewuStats.orderRefundEditedCount,
        matchedProducts: [...pddStats.matchedProducts, ...dewuStats.matchedProducts],
        unmatchedProducts: [...pddStats.unmatchedProducts, ...dewuStats.unmatchedProducts],
        orderProfitRows: [...pddStats.orderProfitRows, ...dewuStats.orderProfitRows],
        pendingOrderRows: [...pddStats.pendingOrderRows, ...dewuStats.pendingOrderRows]
      }
    };
  }, [platformData, purchaseRows, purchaseMapping, month]);

  return {
    platformId: activePlatformId,
    setPlatformId: setActivePlatformId,
    month,
    setMonth,
    salesRows: currentPlatformData.salesRows,
    purchaseRows,
    salesFileNames: currentPlatformData.salesFileNames,
    purchaseFileNames,
    salesMapping: currentPlatformData.salesMapping,
    setSalesMapping: (mapping) =>
      setPlatformData((prev) => ({
        ...prev,
        [activePlatformId]: { ...prev[activePlatformId], salesMapping: mapping }
      })),
    purchaseMapping,
    setPurchaseMapping,
    costSettings: currentPlatformData.costSettings || DEFAULT_COST_SETTINGS,
    setCostSettings: updateCostSetting,
    updateOrderRefundOverride,
    updateOrderReturnOverride,
    error,
    handleSalesUpload,
    handlePurchaseUpload,
    stats: activeStats,
    combinedStats,
    platformData,
    clearData
  };
}