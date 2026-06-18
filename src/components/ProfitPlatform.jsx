import { useRef, useState } from 'react';
import ManualOrderInput from './ManualOrderInput';
import MatchDetailsPanel from './MatchDetailsPanel';
import PlatformTabs from './PlatformTabs';
import ReportPanel from './ReportPanel';
import RulePanel from './RulePanel';
import StatsPanel from './StatsPanel';
import UploadPanel from './UploadPanel';
import { PURCHASE_FIELDS, PURCHASE_HINT_TEXT, SALES_FIELDS, SALES_HINT_TEXT } from '../constants/columnHints';
import { PLATFORM_PRESETS } from '../constants/platformPresets';
import { useProfitPlatform } from '../hooks/useProfitPlatform';
import { exportElementToImage, exportElementToPdf } from '../utils/exportPdf';

export default function ProfitPlatform() {
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
    addManualOrders,
    deleteManualOrder,
    clearManualOrders,
    stats,
    combinedStats,
    platformData,
    clearData
  } = useProfitPlatform();

  const [isExporting, setIsExporting] = useState(false);
  const [exportMode, setExportMode] = useState('single');
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
        <div className="profit-layout">
          {/* Left column: controls */}
          <div className="profit-left">
            <PlatformTabs platformId={platformId} onChange={setPlatformId} />

            <section className="top-row">
              <label>
                统计月份
                <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
              </label>
              <div className="export-controls">
                <div className="export-mode-selector">
                  <label>
                    <input type="radio" name="exportMode" value="single" checked={exportMode === 'single'} onChange={(e) => setExportMode(e.target.value)} />
                    单平台
                  </label>
                  <label>
                    <input type="radio" name="exportMode" value="combined" checked={exportMode === 'combined'} onChange={(e) => setExportMode(e.target.value)} />
                    合并
                  </label>
                </div>
                <button className="primary-action" type="button" onClick={handleDownloadPdf} disabled={isExporting}>
                  {isExporting ? '生成中...' : 'PDF'}
                </button>
                <button className="secondary-action" type="button" onClick={handleDownloadImage} disabled={isExporting}>
                  {isExporting ? '生成中...' : '图片'}
                </button>
              </div>
            </section>

            <section className="grid">
              {platformId === 'manual' ? null : (
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
              )}

              {platformId !== 'manual' && (
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
              )}
            </section>

            {platformId !== 'manual' && (
              <RulePanel platformPreset={activePreset} costSettings={costSettings} setCostSettings={setCostSettings} />
            )}

            {error && <div className="error">{error}</div>}
          </div>

          {/* Right column: stats + detail tables */}
          <div className="profit-right">
            <StatsPanel stats={stats} />
            {platformId === 'manual' ? (
              <div className="manual-right-wrap">
                <ManualOrderInput
                  rows={salesRows}
                  onAdd={addManualOrders}
                  onDelete={deleteManualOrder}
                  onClear={clearManualOrders}
                />
              </div>
            ) : (
              <MatchDetailsPanel stats={stats} updateOrderRefundOverride={updateOrderRefundOverride} updateOrderReturnOverride={updateOrderReturnOverride} />
            )}
          </div>
        </div>
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
