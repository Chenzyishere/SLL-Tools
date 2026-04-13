import MatchDetailsPanel from './components/MatchDetailsPanel';
import RulePanel from './components/RulePanel';
import StatsPanel from './components/StatsPanel';
import UploadPanel from './components/UploadPanel';
import { PURCHASE_FIELDS, PURCHASE_HINT_TEXT, SALES_FIELDS, SALES_HINT_TEXT } from './constants/columnHints';
import { useProfitPlatform } from './hooks/useProfitPlatform';

export default function App() {
  const {
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
  } = useProfitPlatform();

  return (
    <main className="app">
      <header>
        <h1>月利润数据平台</h1>
        <p>上传销售订单 + 商品进货价表，自动计算当月利润</p>
      </header>

      <section className="top-row">
        <label>
          统计月份
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
      </section>

      <section className="grid">
        <UploadPanel
          title="销售订单表"
          rows={salesRows}
          onUpload={handleSalesUpload}
          mapping={salesMapping}
          onMappingChange={setSalesMapping}
          fields={SALES_FIELDS}
          hints={SALES_HINT_TEXT}
        />

        <UploadPanel
          title="商品进货价表"
          rows={purchaseRows}
          onUpload={handlePurchaseUpload}
          mapping={purchaseMapping}
          onMappingChange={setPurchaseMapping}
          fields={PURCHASE_FIELDS}
          hints={PURCHASE_HINT_TEXT}
        />
      </section>

      <RulePanel costSettings={costSettings} setCostSettings={setCostSettings} />

      <StatsPanel stats={stats} />
      <MatchDetailsPanel stats={stats} updateOrderRefundOverride={updateOrderRefundOverride} />

      {error && <div className="error">{error}</div>}
    </main>
  );
}
