import { formatMoney } from '../utils/format';

function ProductList({ title, products, matched }) {
  return (
    <section className="panel list-panel">
      <h2>{title}</h2>
      <div className="meta">共 {products.length} 个商品</div>

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
    </section>
  );
}

function PendingOrderList({ rows }) {
  return (
    <section className="panel list-panel full-width">
      <h2>待入账订单清单</h2>
      <div className="meta">共 {rows.length} 单待入账订单</div>

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

function OrderProfitList({ rows, updateOrderRefundOverride }) {
  return (
    <section className="panel list-panel full-width">
      <h2>订单利润核对清单</h2>
      <div className="meta">按订单号聚合，共 {rows.length} 单（订单利润不含月增重费分摊）</div>

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

export default function MatchDetailsPanel({ stats, updateOrderRefundOverride }) {
  return (
    <section className="list-grid">
      <ProductList title="已匹配商品清单" products={stats.matchedProducts || []} matched />
      <ProductList title="未匹配商品清单（待补进货价）" products={stats.unmatchedProducts || []} matched={false} />
      <PendingOrderList rows={stats.pendingOrderRows || []} />
      <OrderProfitList rows={stats.orderProfitRows || []} updateOrderRefundOverride={updateOrderRefundOverride} />
    </section>
  );
}
