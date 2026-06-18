import { forwardRef } from 'react';
import { PLATFORM_PRESETS } from '../constants/platformPresets';
import { formatMoney } from '../utils/format';

function ReportMetric({ label, value, highlight }) {
  return (
    <div className={`report-metric ${highlight ? 'highlight' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PlatformSection({ platformId, stats, salesFileNames }) {
  const platform = PLATFORM_PRESETS[platformId];
  if (!platform) return null;

  const hasData = stats.salesCount > 0;
  if (!hasData) return null;

  return (
    <section className="platform-section">
      <div className="platform-header">
        <h2>{platform.name}</h2>
        <span className="platform-badge">{stats.salesCount} 有效订单</span>
      </div>

      <div className="platform-summary">
        <div className="summary-item">
          <span>净收入</span>
          <strong>¥ {formatMoney(stats.revenue)}</strong>
        </div>
        <div className="summary-item">
          <span>总成本</span>
          <strong>¥ {formatMoney(stats.cost)}</strong>
        </div>
        <div className="summary-item profit">
          <span>利润</span>
          <strong className={stats.profit >= 0 ? 'positive' : 'negative'}>
            ¥ {formatMoney(stats.profit)}
          </strong>
        </div>
      </div>

      <div className="cost-breakdown">
        <table className="breakdown-table">
          <tbody>
            {stats.productCost > 0 && (
              <tr>
                <td>商品成本</td>
                <td className="amount">¥ {formatMoney(stats.productCost)}</td>
              </tr>
            )}
            {stats.shippingCost > 0 && (
              <tr>
                <td>运费</td>
                <td className="amount">¥ {formatMoney(stats.shippingCost)}</td>
              </tr>
            )}
            {(stats.experienceFeeTotal || 0) > 0 && (
              <tr>
                <td>体验提升费</td>
                <td className="amount">¥ {formatMoney(stats.experienceFeeTotal)}</td>
              </tr>
            )}
            {(stats.techServiceFeeTotal || 0) > 0 && (
              <tr>
                <td>技术服务费</td>
                <td className="amount">¥ {formatMoney(stats.techServiceFeeTotal)}</td>
              </tr>
            )}
            {(stats.platformFeeTotal || 0) > 0 && (
              <tr>
                <td>平台扣费</td>
                <td className="amount">¥ {formatMoney(stats.platformFeeTotal)}</td>
              </tr>
            )}
            {stats.weightFee > 0 && (
              <tr>
                <td>月增重费</td>
                <td className="amount">¥ {formatMoney(stats.weightFee)}</td>
              </tr>
            )}
            {(stats.warehouseFeeTotal || 0) > 0 && (
              <tr>
                <td>仓运费</td>
                <td className="amount">¥ {formatMoney(stats.warehouseFeeTotal)}</td>
              </tr>
            )}
            {(stats.returnShippingCost || 0) > 0 && (
              <tr>
                <td>退货运费</td>
                <td className="amount refund">¥ {formatMoney(stats.returnShippingCost)}</td>
              </tr>
            )}
            {(stats.refundTotal || 0) > 0 && (
              <tr>
                <td>手工退款</td>
                <td className="amount refund">¥ {formatMoney(stats.refundTotal)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {salesFileNames && salesFileNames.length > 0 && (
        <div className="file-source">
          <span className="source-label">订单文件：</span>
          <span className="source-value">{salesFileNames.join('、')}</span>
        </div>
      )}

      {(!salesFileNames || salesFileNames.length === 0) && stats.salesCount > 0 && (
        <div className="file-source">
          <span className="source-label">来源：</span>
          <span className="source-value">手动录入</span>
        </div>
      )}

      {stats.invalidCount > 0 && (
        <div className="note invalid">无效订单：{stats.invalidCount} 条</div>
      )}
      {stats.pendingCount > 0 && (
        <div className="note pending">待入账订单：{stats.pendingCount} 条</div>
      )}
    </section>
  );
}

const ReportPanel = forwardRef(function ReportPanel(
  { platformId, month, stats, combinedStats, exportMode, salesFileNames, purchaseFileNames, platformData },
  ref
) {
  const platformName = PLATFORM_PRESETS[platformId]?.name || '未选择平台';
  const reportDate = new Date().toLocaleDateString('zh-CN');

  return (
    <section className="report-export" ref={ref}>
      <header className="report-header">
        <div className="report-title-row">
          <h1>
            {exportMode === 'combined' ? '双平台合并月利润报表' : `${platformName}月利润报表`}
          </h1>
          {exportMode === 'combined' && (
            <span className="combined-badge">拼多多 + 得物 + 手动输入</span>
          )}
        </div>
        <p className="report-subtitle">
          统计月份：{month || '-'} · 生成日期：{reportDate}
        </p>
      </header>

      {exportMode === 'combined' && combinedStats ? (
        <>
          <div className="report-metrics-main">
            <ReportMetric label="总净收入" value={`¥ ${formatMoney(combinedStats.combined.revenue)}`} />
            <ReportMetric label="总成本" value={`¥ ${formatMoney(combinedStats.combined.cost)}`} />
            <ReportMetric
              label="总利润"
              value={`¥ ${formatMoney(combinedStats.combined.profit)}`}
              highlight={true}
            />
            <ReportMetric
              label="有效订单"
              value={`${combinedStats.combined.salesCount} 条`}
            />
          </div>

          <div className="platforms-container">
            <PlatformSection
              platformId="pinduoduo"
              stats={combinedStats.pinduoduo}
              salesFileNames={platformData?.pinduoduo?.salesFileNames}
            />
            <PlatformSection
              platformId="dewu"
              stats={combinedStats.dewu}
              salesFileNames={platformData?.dewu?.salesFileNames}
            />
            <PlatformSection
              platformId="manual"
              stats={combinedStats.manual}
              salesFileNames={platformData?.manual?.salesFileNames}
            />
          </div>

          <section className="report-section summary-section">
            <h2>合并汇总</h2>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>平台</th>
                  <th>有效订单</th>
                  <th>净收入</th>
                  <th>总成本</th>
                  <th>利润</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>拼多多</td>
                  <td>{combinedStats.pinduoduo.salesCount}</td>
                  <td>¥ {formatMoney(combinedStats.pinduoduo.revenue)}</td>
                  <td>¥ {formatMoney(combinedStats.pinduoduo.cost)}</td>
                  <td className={combinedStats.pinduoduo.profit >= 0 ? 'positive' : 'negative'}>
                    ¥ {formatMoney(combinedStats.pinduoduo.profit)}
                  </td>
                </tr>
                <tr>
                  <td>得物</td>
                  <td>{combinedStats.dewu.salesCount}</td>
                  <td>¥ {formatMoney(combinedStats.dewu.revenue)}</td>
                  <td>¥ {formatMoney(combinedStats.dewu.cost)}</td>
                  <td className={combinedStats.dewu.profit >= 0 ? 'positive' : 'negative'}>
                    ¥ {formatMoney(combinedStats.dewu.profit)}
                  </td>
                </tr>
                <tr>
                  <td>手动输入</td>
                  <td>{combinedStats.manual.salesCount}</td>
                  <td>¥ {formatMoney(combinedStats.manual.revenue)}</td>
                  <td>¥ {formatMoney(combinedStats.manual.cost)}</td>
                  <td className={combinedStats.manual.profit >= 0 ? 'positive' : 'negative'}>
                    ¥ {formatMoney(combinedStats.manual.profit)}
                  </td>
                </tr>
                <tr className="total-row">
                  <td><strong>合计</strong></td>
                  <td><strong>{combinedStats.combined.salesCount}</strong></td>
                  <td>
                    <strong>¥ {formatMoney(combinedStats.combined.revenue)}</strong>
                  </td>
                  <td>
                    <strong>¥ {formatMoney(combinedStats.combined.cost)}</strong>
                  </td>
                  <td className="total-profit">
                    <strong
                      className={combinedStats.combined.profit >= 0 ? 'positive' : 'negative'}
                    >
                      ¥ {formatMoney(combinedStats.combined.profit)}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </>
      ) : (
        <>
          <div className="report-metrics-main">
            <ReportMetric label="净收入" value={`¥ ${formatMoney(stats.revenue)}`} />
            <ReportMetric label="总成本" value={`¥ ${formatMoney(stats.cost)}`} />
            <ReportMetric label="利润" value={`¥ ${formatMoney(stats.profit)}`} highlight={true} />
            <ReportMetric label="有效订单" value={`${stats.salesCount} 条`} />
          </div>

          <section className="report-section">
            <h2>成本明细</h2>
            <table className="report-table">
              <tbody>
                <tr>
                  <th>商品成本</th>
                  <td>¥ {formatMoney(stats.productCost)}</td>
                  <th>运费</th>
                  <td>¥ {formatMoney(stats.shippingCost)}</td>
                </tr>
                <tr>
                  <th>体验提升费</th>
                  <td>¥ {formatMoney(stats.experienceFeeTotal || 0)}</td>
                  <th>技术服务费</th>
                  <td>¥ {formatMoney(stats.techServiceFeeTotal || 0)}</td>
                </tr>
                <tr>
                  <th>平台扣费</th>
                  <td>¥ {formatMoney(stats.platformFeeTotal || 0)}</td>
                  <th>月增重费</th>
                  <td>¥ {formatMoney(stats.weightFee)}</td>
                </tr>
                <tr>
                  <th>仓运费</th>
                  <td>¥ {formatMoney(stats.warehouseFeeTotal || 0)}</td>
                  <th>退货运费</th>
                  <td>¥ {formatMoney(stats.returnShippingCost || 0)}</td>
                </tr>
                <tr>
                  <th>手工退款</th>
                  <td>¥ {formatMoney(stats.refundTotal || 0)}</td>
                  <th>无效订单</th>
                  <td>{stats.invalidCount} 条</td>
                  <th>待入账订单</th>
                  <td>{stats.pendingCount} 条</td>
                </tr>
              </tbody>
            </table>
          </section>
        </>
      )}

      <section className="report-section">
        <h2>文件来源</h2>
        <div className="file-info">
          <div className="file-row">
            <span className="file-label">进货表：</span>
            <span className="file-value">{purchaseFileNames.length ? purchaseFileNames.join('、') : '-'}</span>
          </div>
        </div>
      </section>

      {exportMode === 'single' && stats.orderProfitRows && stats.orderProfitRows.length > 0 && (
        <section className="report-section">
          <h2>订单利润明细</h2>
          <table className="order-detail-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>状态分类</th>
                <th>净收入</th>
                <th>成本</th>
                <th>利润</th>
              </tr>
            </thead>
            <tbody>
              {stats.orderProfitRows.slice(0, 50).map((order) => (
                <tr key={order.orderId}>
                  <td>{order.orderId}</td>
                  <td>{order.category}</td>
                  <td>¥ {formatMoney(order.netRevenue || 0)}</td>
                  <td>
                    ¥{' '}
                    {formatMoney(
                      (order.productCost || 0) +
                        (order.shippingCost || 0) +
                        (order.experienceFee || 0) +
                        (order.techServiceFee || 0)
                    )}
                  </td>
                  <td className={order.profit >= 0 ? 'positive' : 'negative'}>
                    ¥ {formatMoney(order.profit || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </section>
  );
});

export default ReportPanel;