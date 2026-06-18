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
    purchaseMapping: { ...EMPTY_PURCHASE_MAPPING },
    costSettings: { ...getPlatformCostDefaults(platformId) },
    orderRefundOverrides: {},
    orderReturnOverrides: {}
  };
}

function migrateLegacyData(saved) {
  if (!saved?.platformData) return saved;
  if (saved.purchaseMapping) {
    for (const pid of Object.keys(saved.platformData)) {
      if (!saved.platformData[pid].purchaseMapping) {
        saved.platformData[pid] = {
          ...saved.platformData[pid],
          purchaseMapping: { ...saved.purchaseMapping }
        };
      }
    }
    delete saved.purchaseMapping;
  }
  // Ensure manual platform exists for backward compatibility
  if (!saved.platformData.manual) {
    saved.platformData.manual = createPlatformData('manual');
  }
  return saved;
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
  const [platformData, setPlatformData] = useState(() => {
    const saved = loadPersistedState();
    if (saved) migrateLegacyData(saved);
    if (saved?.platformData) return saved.platformData;
    return {
      pinduoduo: createPlatformData('pinduoduo'),
      dewu: createPlatformData('dewu'),
      manual: createPlatformData('manual')
    };
  });
  const [error, setError] = useState('');

  const currentPlatformData = platformData[activePlatformId];
  const purchaseMapping = currentPlatformData.purchaseMapping || EMPTY_PURCHASE_MAPPING;

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
    if (!purchaseColumns.length) return;

    setPlatformData((prev) => {
      const next = { ...prev };
      for (const pid of Object.keys(next)) {
        next[pid] = {
          ...next[pid],
          purchaseMapping: buildPurchaseMapping(purchaseColumns, pid)
        };
      }
      return next;
    });
  }, [purchaseRows]);

  // Persist state to localStorage on every change.
  useEffect(() => {
    savePersistedState({
      activePlatformId,
      month,
      platformData,
      purchaseRows,
      purchaseFileNames
    });
  }, [activePlatformId, month, platformData, purchaseRows, purchaseFileNames]);

  function clearData() {
    clearPersistedState();
    setActivePlatformId(DEFAULT_PLATFORM_ID);
    setMonth(getDefaultMonth());
    setPlatformData({
      pinduoduo: createPlatformData('pinduoduo'),
      dewu: createPlatformData('dewu'),
      manual: createPlatformData('manual')
    });
    setPurchaseRows([]);
    setPurchaseFileNames([]);
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
      setPlatformData((prev) => {
        const next = { ...prev };
        for (const pid of Object.keys(next)) {
          next[pid] = {
            ...next[pid],
            purchaseMapping: buildPurchaseMapping(columns, pid)
          };
        }
        return next;
      });
    } catch (err) {
      setError(`进货表解析失败：${err.message || err}`);
    }
  }

  function addManualOrders(newRows) {
    setPlatformData((prev) => {
      const existingRows = prev.manual.salesRows;
      const hasExisting = existingRows.length > 0;
      const mergedRows = [...existingRows, ...newRows];
      const columns = mergedRows[0] ? Object.keys(mergedRows[0]) : [];
      return {
        ...prev,
        manual: {
          ...prev.manual,
          salesRows: mergedRows,
          salesFileNames: ['手动录入'],
          salesMapping: hasExisting ? prev.manual.salesMapping : buildSalesMapping(columns, 'manual')
        }
      };
    });
  }

  function deleteManualOrder(index) {
    setPlatformData((prev) => {
      const nextRows = prev.manual.salesRows.filter((_, i) => i !== index);
      return {
        ...prev,
        manual: {
          ...prev.manual,
          salesRows: nextRows,
          salesFileNames: nextRows.length > 0 ? ['手动录入'] : []
        }
      };
    });
  }

  function clearManualOrders() {
    setPlatformData((prev) => ({
      ...prev,
      manual: {
        ...prev.manual,
        salesRows: [],
        salesFileNames: [],
        orderRefundOverrides: {},
        orderReturnOverrides: {}
      }
    }));
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

  function setPurchaseMapping(mapping) {
    setPlatformData((prev) => ({
      ...prev,
      [activePlatformId]: {
        ...prev[activePlatformId],
        purchaseMapping: mapping
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
    const pdd = platformData.pinduoduo;
    const dewu = platformData.dewu;
    const pddPurchaseMapping = pdd.purchaseMapping || EMPTY_PURCHASE_MAPPING;
    const dewuPurchaseMapping = dewu.purchaseMapping || EMPTY_PURCHASE_MAPPING;

    const pddStats = calcProfitByPurchasePrice(
      pdd.salesRows,
      purchaseRows,
      pdd.salesMapping,
      pddPurchaseMapping,
      month,
      pdd.costSettings || getPlatformCostDefaults('pinduoduo'),
      pdd.orderRefundOverrides,
      pdd.orderReturnOverrides
    );

    const dewuStats = calcProfitByPurchasePrice(
      dewu.salesRows,
      purchaseRows,
      dewu.salesMapping,
      dewuPurchaseMapping,
      month,
      dewu.costSettings || getPlatformCostDefaults('dewu'),
      dewu.orderRefundOverrides,
      dewu.orderReturnOverrides
    );

    const manual = platformData.manual;
    const manualPurchaseMapping = manual.purchaseMapping || EMPTY_PURCHASE_MAPPING;

    const manualStats = calcProfitByPurchasePrice(
      manual.salesRows,
      purchaseRows,
      manual.salesMapping,
      manualPurchaseMapping,
      month,
      manual.costSettings || getPlatformCostDefaults('manual'),
      manual.orderRefundOverrides,
      manual.orderReturnOverrides
    );

    return {
      pinduoduo: pddStats,
      dewu: dewuStats,
      manual: manualStats,
      combined: {
        revenue: pddStats.revenue + dewuStats.revenue + manualStats.revenue,
        grossRevenue: pddStats.grossRevenue + dewuStats.grossRevenue + manualStats.grossRevenue,
        refundTotal: pddStats.refundTotal + dewuStats.refundTotal + manualStats.refundTotal,
        cost: pddStats.cost + dewuStats.cost + manualStats.cost,
        productCost: pddStats.productCost + dewuStats.productCost + manualStats.productCost,
        shippingCost: pddStats.shippingCost + dewuStats.shippingCost + manualStats.shippingCost,
        experienceFeeTotal: (pddStats.experienceFeeTotal || 0) + (dewuStats.experienceFeeTotal || 0) + (manualStats.experienceFeeTotal || 0),
        techServiceFeeTotal: (pddStats.techServiceFeeTotal || 0) + (dewuStats.techServiceFeeTotal || 0) + (manualStats.techServiceFeeTotal || 0),
        platformFeeTotal: (pddStats.platformFeeTotal || 0) + (dewuStats.platformFeeTotal || 0) + (manualStats.platformFeeTotal || 0),
        shippingOrderCount: pddStats.shippingOrderCount + dewuStats.shippingOrderCount + manualStats.shippingOrderCount,
        weightFee: pddStats.weightFee + dewuStats.weightFee + manualStats.weightFee,
        warehouseFeeTotal: (pddStats.warehouseFeeTotal || 0) + (dewuStats.warehouseFeeTotal || 0) + (manualStats.warehouseFeeTotal || 0),
        inboundWarehouseShippingFee: (pddStats.inboundWarehouseShippingFee || 0) + (dewuStats.inboundWarehouseShippingFee || 0) + (manualStats.inboundWarehouseShippingFee || 0),
        outboundWarehouseShippingFee: (pddStats.outboundWarehouseShippingFee || 0) + (dewuStats.outboundWarehouseShippingFee || 0) + (manualStats.outboundWarehouseShippingFee || 0),
        profit: pddStats.profit + dewuStats.profit + manualStats.profit,
        salesCount: pddStats.salesCount + dewuStats.salesCount + manualStats.salesCount,
        matchedCount: pddStats.matchedCount + dewuStats.matchedCount + manualStats.matchedCount,
        unmatchedCount: pddStats.unmatchedCount + dewuStats.unmatchedCount + manualStats.unmatchedCount,
        invalidCount: pddStats.invalidCount + dewuStats.invalidCount + manualStats.invalidCount,
        pendingCount: pddStats.pendingCount + dewuStats.pendingCount + manualStats.pendingCount,
        pendingAmount: pddStats.pendingAmount + dewuStats.pendingAmount + manualStats.pendingAmount,
        refundReviewCount: pddStats.refundReviewCount + dewuStats.refundReviewCount + manualStats.refundReviewCount,
        refundReviewTotal: pddStats.refundReviewTotal + dewuStats.refundReviewTotal + manualStats.refundReviewTotal,
        returnOrderCount: (pddStats.returnOrderCount || 0) + (dewuStats.returnOrderCount || 0) + (manualStats.returnOrderCount || 0),
        returnShippingCost: (pddStats.returnShippingCost || 0) + (dewuStats.returnShippingCost || 0) + (manualStats.returnShippingCost || 0),
        filteredByStatus: pddStats.filteredByStatus + dewuStats.filteredByStatus + manualStats.filteredByStatus,
        orderRefundEditedCount: pddStats.orderRefundEditedCount + dewuStats.orderRefundEditedCount + manualStats.orderRefundEditedCount,
        matchedProducts: [...pddStats.matchedProducts, ...dewuStats.matchedProducts, ...manualStats.matchedProducts],
        unmatchedProducts: [...pddStats.unmatchedProducts, ...dewuStats.unmatchedProducts, ...manualStats.unmatchedProducts],
        orderProfitRows: [...pddStats.orderProfitRows, ...dewuStats.orderProfitRows, ...manualStats.orderProfitRows],
        pendingOrderRows: [...pddStats.pendingOrderRows, ...dewuStats.pendingOrderRows, ...manualStats.pendingOrderRows]
      }
    };
  }, [platformData, purchaseRows, month]);

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
    addManualOrders,
    deleteManualOrder,
    clearManualOrders,
    stats: activeStats,
    combinedStats,
    platformData,
    clearData
  };
}