import { formatMoney } from '../utils/format';
import CollapsibleSection from './CollapsibleSection';

function ProductList({ title, products, matched }) {
  return (
    <section className="panel list-panel">
      <CollapsibleSection title={title} meta={`共 ${products.length} 个商品`}>
        <div className="list-table-wrap">
          <table className="list-table">
            <thead>
              <tr>
                <th>商品编码</th>
                <th>商品名称</th>
                <th>订单数</th>
                <th>销量</th>
                {matched && <th>进货价</th>}
                <th>{matched ? '成本合计' : '收入合计'}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={`${item.sku}-${item.name}`}>
                  <td>{item.sku}</td>
                  <td>{item.name || '-'}</td>
                  <td>{item.orderCount}</td>
                  <td>{item.totalQty}</td>
                  {matched && <td>¥ {formatMoney(item.purchasePrice || 0)}</td>}
                  <td>¥ {formatMoney(matched ? item.totalCost || 0 : item.totalRevenue || 0)}</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={matched ? 6 : 5} className="empty-row">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>
    </section>
  );
}

function PendingOrderList({ rows }) {
  return (
    <section className="panel list-panel full-width">
      <CollapsibleSection title="待入账订单清单" meta={`共 ${rows.length} 单待入账订单`}>
        <div className="list-table-wrap">
          <table className="list-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>状态</th>
                <th>待入账行数</th>
                <th>待入账金额</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={`pending-${item.orderId}`}>
                  <td>{item.orderId}</td>
                  <td>{item.statuses}</td>
                  <td>{item.pendingLineCount}</td>
                  <td>¥ {formatMoney(item.pendingAmount || 0)}</td>
                  <td>{item.note || '-'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-row">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>
    </section>
  );
}

function getStatusType(status) {
  if (!status) return 'other';
  if (status.includes('已取消') || status.includes('未发货')) return 'invalid';
  if (status.includes('待收货')) return 'pending';
  if (status.includes('退款成功')) return 'refund';
  if (status.includes('已收货')) return 'received';
  if (status.includes('已发货')) return 'shipped';
  return 'other';
}

function getStatusCategory(statusesText) {
  const text = String(statusesText || '');
  if (text.includes('已取消') || text.includes('未发货')) return { key: 'invalid', label: '无效' };
  if (text.includes('待收货')) return { key: 'pending', label: '待入账' };
  if (text.includes('退款成功')) return { key: 'refund', label: '退款相关' };
  if (text.includes('已收货')) return { key: 'received', label: '已收货' };
  if (text.includes('已发货')) return { key: 'shipped', label: '已发货' };
  return { key: 'other', label: '其他' };
}

function StatusChips({ statusesText }) {
  const statuses = String(statusesText || '-')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="status-chip-wrap">
      {statuses.map((status) => (
        <span key={status} className={`status-chip status-chip-${getStatusType(status)}`}>
          {status}
        </span>
      ))}
      {statuses.length === 0 && <span className="status-chip status-chip-other">-</span>}
    </div>
  );
}

function RefundOrderCard({ rows, updateOrderRefundOverride, updateOrderReturnOverride }) {
  const totalRefund = rows.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  const totalRevenue = rows.reduce((sum, r) => sum + (r.grossRevenue || 0), 0);
  const returnCount = rows.filter((r) => r.isReturn).length;

  return (
    <section className="panel list-panel full-width refund-card">
      <div className="panel-title-row">
        <h2>退款订单处理</h2>
        <span className="refund-summary">
          共 {rows.length} 单 · 订单收入合计 ¥{formatMoney(totalRevenue)} · 退款合计 ¥{formatMoney(totalRefund)}
          {returnCount > 0 && ` · 退货 ${returnCount} 单（每单 -¥3.80）`}
        </span>
      </div>

      <div className="list-table-wrap">
        <table className="list-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>状态</th>
              <th>订单收入</th>
              <th className="refund-col-header">退款金额</th>
              <th>是否退货</th>
              <th>订单净收入</th>
              <th>商品成本</th>
              <th>运费</th>
              <th>体验费</th>
              <th>服务费</th>
              <th>退货运费</th>
              <th>订单利润</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={`refund-${item.orderId}`}>
                <td>{item.orderId}</td>
                <td>
                  <StatusChips statusesText={item.statuses} />
                </td>
                <td>¥ {formatMoney(item.grossRevenue || 0)}</td>
                <td>
                  <input
                    className="refund-input refund-input-prominent"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.refundAmount || 0}
                    onChange={(e) => updateOrderRefundOverride(item.orderId, e.target.value)}
                  />
                </td>
                <td className="return-check-cell">
                  <label className="return-check-label">
                    <input
                      type="checkbox"
                      className="return-checkbox"
                      checked={item.isReturn || false}
                      onChange={(e) => updateOrderReturnOverride(item.orderId, e.target.checked)}
                    />
                    <span className="return-check-text">{item.isReturn ? '是' : '否'}</span>
                  </label>
                </td>
                <td>¥ {formatMoney(item.netRevenue || 0)}</td>
                <td>¥ {formatMoney(item.productCost || 0)}</td>
                <td>¥ {formatMoney(item.shippingCost || 0)}</td>
                <td>¥ {formatMoney(item.experienceFee || 0)}</td>
                <td>¥ {formatMoney(item.techServiceFee || 0)}</td>
                <td className="return-fee-cell">
                  {item.isReturn ? <span className="return-fee-value">-¥3.80</span> : '-'}
                </td>
                <td className={item.profit >= 0 ? 'profit-positive' : 'profit-negative'}>
                  ¥ {formatMoney(item.profit || 0)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className="empty-row">
                  暂无退款订单
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OrderProfitList({ rows, updateOrderRefundOverride }) {
  return (
    <section className="panel list-panel full-width">
      <h2>订单利润核对清单</h2>
      <div className="meta">已入账 / 待入账 / 无效订单，共 {rows.length} 单（退款订单已独立展示）</div>

      <div className="list-table-wrap">
        <table className="list-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>状态分类</th>
              <th>状态</th>
              <th>订单收入</th>
              <th>退款金额</th>
              <th>订单净收入</th>
              <th>商品成本</th>
              <th>运费</th>
              <th>体验费</th>
              <th>服务费</th>
              <th>订单利润</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const statusCategory = getStatusCategory(item.statuses);
              return (
                <tr key={`order-profit-${item.orderId}`}>
                  <td>{item.orderId}</td>
                  <td>
                    <span className={`status-category status-chip-${statusCategory.key}`}>{statusCategory.label}</span>
                  </td>
                  <td>
                    <StatusChips statusesText={item.statuses} />
                  </td>
                  <td>¥ {formatMoney(item.grossRevenue || 0)}</td>
                  <td>
                    <input
                      className="refund-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.refundAmount || 0}
                      disabled={!item.editableRefund}
                      onChange={(e) => updateOrderRefundOverride(item.orderId, e.target.value)}
                    />
                  </td>
                  <td>¥ {formatMoney(item.netRevenue || 0)}</td>
                  <td>¥ {formatMoney(item.productCost || 0)}</td>
                  <td>¥ {formatMoney(item.shippingCost || 0)}</td>
                  <td>¥ {formatMoney(item.experienceFee || 0)}</td>
                  <td>¥ {formatMoney(item.techServiceFee || 0)}</td>
                  <td>¥ {formatMoney(item.profit || 0)}</td>
                  <td>{item.note || '-'}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className="empty-row">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function MatchDetailsPanel({ stats, updateOrderRefundOverride, updateOrderReturnOverride }) {
  const allRows = stats.orderProfitRows || [];
  const refundRows = allRows.filter((row) => {
    const category = getStatusCategory(row.statuses);
    return category.key === 'refund' && row.editableRefund;
  });
  const otherRows = allRows.filter((row) => {
    const category = getStatusCategory(row.statuses);
    return !(category.key === 'refund' && row.editableRefund);
  });

  return (
    <section className="list-grid">
      <ProductList title="已匹配商品清单" products={stats.matchedProducts || []} matched />
      <ProductList title="未匹配商品清单（待补进货价）" products={stats.unmatchedProducts || []} matched={false} />
      <PendingOrderList rows={stats.pendingOrderRows || []} />
      <RefundOrderCard rows={refundRows} updateOrderRefundOverride={updateOrderRefundOverride} updateOrderReturnOverride={updateOrderReturnOverride} />
      <OrderProfitList rows={otherRows} updateOrderRefundOverride={updateOrderRefundOverride} />
    </section>
  );
}
