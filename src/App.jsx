import { useRef, useState } from 'react';
import MatchDetailsPanel from './components/MatchDetailsPanel';
import PlatformTabs from './components/PlatformTabs';
import ReportPanel from './components/ReportPanel';
import RulePanel from './components/RulePanel';
import StatsPanel from './components/StatsPanel';
import UploadPanel from './components/UploadPanel';
import { PURCHASE_FIELDS, PURCHASE_HINT_TEXT, SALES_FIELDS, SALES_HINT_TEXT } from './constants/columnHints';
import { PLATFORM_PRESETS } from './constants/platformPresets';
import { useProfitPlatform } from './hooks/useProfitPlatform';
import { exportElementToImage, exportElementToPdf } from './utils/exportPdf';

export default function App() {
  const {
    platformId,
    setPlatformId,
    month,
    setMonth,
    salesRows,
    purchaseRows,
    salesFileNames,
    purchaseFileNames,
    salesMapping,
    setSalesMapping,
    purchaseMapping,
    setPurchaseMapping,
    costSettings,
    setCostSettings,
    updateOrderRefundOverride,
    updateOrderReturnOverride,
    error,
    handleSalesUpload,
    handlePurchaseUpload,
    stats,
    combinedStats,
    platformData,
    clearData
  } = useProfitPlatform();

  const [isExporting, setIsExporting] = useState(false);
  const [exportMode, setExportMode] = useState('single'); // 'single' | 'combined'
  const reportRef = useRef(null);
  const activePreset = PLATFORM_PRESETS[platformId];

  async function handleDownloadPdf() {
    try {
      setIsExporting(true);
      let filename;
      if (exportMode === 'combined') {
        filename = `合并利润报表-${month || '报表'}.pdf`;
      } else {
        filename = `${activePreset.name || '利润'}-${month || '报表'}.pdf`;
      }
      await exportElementToPdf(reportRef.current, filename);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDownloadImage() {
    try {
      setIsExporting(true);
      let filename;
      if (exportMode === 'combined') {
        filename = `合并利润报表-${month || '报表'}.png`;
      } else {
        filename = `${activePreset.name || '利润'}-${month || '报表'}.png`;
      }
      await exportElementToImage(reportRef.current, filename);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <main className="app">
        <header>
          <h1>月利润数据平台</h1>
          <p>支持拼多多/得物双平台 · 上传订单文件和进货表后自动计算利润
            <button type="button" className="clear-data-btn" onClick={() => { if (confirm('确定清除所有数据？')) clearData(); }}>
              清除数据
            </button>
          </p>
        </header>

        <PlatformTabs platformId={platformId} onChange={setPlatformId} />

        <section className="top-row">
          <label>
            统计月份
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
          <div className="export-controls">
            <div className="export-mode-selector">
              <label>
                <input
                  type="radio"
                  name="exportMode"
                  value="single"
                  checked={exportMode === 'single'}
                  onChange={(e) => setExportMode(e.target.value)}
                />
                单平台报表
              </label>
              <label>
                <input
                  type="radio"
                  name="exportMode"
                  value="combined"
                  checked={exportMode === 'combined'}
                  onChange={(e) => setExportMode(e.target.value)}
                />
                合并报表
              </label>
            </div>
            <button className="primary-action" type="button" onClick={handleDownloadPdf} disabled={isExporting}>
              {isExporting ? '正在生成...' : '下载 PDF 报表'}
            </button>
            <button className="secondary-action" type="button" onClick={handleDownloadImage} disabled={isExporting}>
              {isExporting ? '正在生成...' : '下载图片报表'}
            </button>
          </div>
        </section>

        <section className="grid">
          <UploadPanel
            title={`${activePreset.name}订单文件`}
            rows={salesRows}
            fileNames={salesFileNames}
            onUpload={handleSalesUpload}
            mapping={salesMapping}
            onMappingChange={setSalesMapping}
            fields={SALES_FIELDS}
            hints={SALES_HINT_TEXT}
            multiple
          />

          <UploadPanel
            title="商品进货价表"
            rows={purchaseRows}
            fileNames={purchaseFileNames}
            onUpload={handlePurchaseUpload}
            mapping={purchaseMapping}
            onMappingChange={setPurchaseMapping}
            fields={PURCHASE_FIELDS}
            hints={PURCHASE_HINT_TEXT}
          />
        </section>

        <RulePanel
          platformPreset={activePreset}
          costSettings={costSettings}
          setCostSettings={setCostSettings}
        />

        <StatsPanel stats={stats} />
        <MatchDetailsPanel stats={stats} updateOrderRefundOverride={updateOrderRefundOverride} updateOrderReturnOverride={updateOrderReturnOverride} />

        {error && <div className="error">{error}</div>}
      </main>

      <ReportPanel
        ref={reportRef}
        platformId={platformId}
        month={month}
        stats={stats}
        combinedStats={combinedStats}
        exportMode={exportMode}
        salesFileNames={salesFileNames}
        purchaseFileNames={purchaseFileNames}
        platformData={platformData}
      />
    </>
  );
}