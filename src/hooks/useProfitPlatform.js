import { useMemo, useState } from 'react';
import { buildPurchaseMapping, buildSalesMapping } from '../constants/mappingBuilders';
import { parseFile } from '../utils/fileParser';
import { calcProfitByPurchasePrice } from '../utils/profitCalculator';
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

const DEFAULT_COST_SETTINGS = {
  baseShippingFee: 3.8,
  monthlyWeightFee: 0,
  consumerExperienceFee: 2.4,
  techServiceRate: 0.006
};

export function useProfitPlatform() {
  const [month, setMonth] = useState(getDefaultMonth());
  const [salesRows, setSalesRows] = useState([]);
  const [purchaseRows, setPurchaseRows] = useState([]);
  const [salesMapping, setSalesMapping] = useState(EMPTY_SALES_MAPPING);
  const [purchaseMapping, setPurchaseMapping] = useState(EMPTY_PURCHASE_MAPPING);
  const [costSettings, setCostSettings] = useState(DEFAULT_COST_SETTINGS);
  const [orderRefundOverrides, setOrderRefundOverrides] = useState({});
  const [error, setError] = useState('');

  async function handleSalesUpload(file) {
    try {
      setError('');
      const rows = await parseFile(file);
      const columns = rows[0] ? Object.keys(rows[0]) : [];
      setSalesRows(rows);
      setSalesMapping(buildSalesMapping(columns));
      setOrderRefundOverrides({});
    } catch (err) {
      setError(`销售表解析失败：${err.message || err}`);
    }
  }

  async function handlePurchaseUpload(file) {
    try {
      setError('');
      const rows = await parseFile(file);
      const columns = rows[0] ? Object.keys(rows[0]) : [];
      setPurchaseRows(rows);
      setPurchaseMapping(buildPurchaseMapping(columns));
    } catch (err) {
      setError(`进货表解析失败：${err.message || err}`);
    }
  }

  function updateOrderRefundOverride(orderId, rawValue) {
    setOrderRefundOverrides((prev) => {
      const next = { ...prev };
      const text = String(rawValue ?? '').trim();

      if (!text) {
        delete next[orderId];
        return next;
      }

      const numeric = Number(text);
      if (Number.isNaN(numeric) || numeric < 0) return prev;

      next[orderId] = numeric;
      return next;
    });
  }

  const stats = useMemo(
    () =>
      calcProfitByPurchasePrice(
        salesRows,
        purchaseRows,
        salesMapping,
        purchaseMapping,
        month,
        costSettings,
        orderRefundOverrides
      ),
    [salesRows, purchaseRows, salesMapping, purchaseMapping, month, costSettings, orderRefundOverrides]
  );

  return {
    month,
    setMonth,
    salesRows,
    purchaseRows,
    salesMapping,
    setSalesMapping,
    purchaseMapping,
    setPurchaseMapping,
    costSettings,
    setCostSettings,
    updateOrderRefundOverride,
    error,
    handleSalesUpload,
    handlePurchaseUpload,
    stats
  };
}
