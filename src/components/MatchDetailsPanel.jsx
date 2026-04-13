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

function RefundReviewList({ rows, updateRefundOverride }) {
  return (
    <section className="panel list-panel full-width">
      <h2>退款核对清单（可编辑）</h2>
      <div className="meta">需要核对 {rows.length} 单退款金额，修改后会实时重算利润</div>

      <div className="list-table-wrap">
        <table className="list-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>状态</th>
              <th>订单金额</th>
              <th>原始退款</th>
              <th>可编辑退款</th>
              <th>净收入</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.lineKey}>
                <td>{item.orderId}</td>
                <td>{item.status}</td>
                <td>¥ {formatMoney(item.amount)}</td>
                <td>¥ {formatMoney(item.sourceRefundAmount || 0)}</td>
                <td>
                  <input
                    className="refund-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.refundAmount}
                    onChange={(e) => updateRefundOverride(item.lineKey, e.target.value)}
                  />
                </td>
                <td>
                  ¥ {formatMoney(item.netAmount)}
                  {item.isManual ? <span className="manual-tag">手动</span> : null}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">
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

function OrderProfitList({ rows }) {
  return (
    <section className="panel list-panel full-width">
      <h2>订单利润核对清单</h2>
      <div className="meta">按订单号聚合，共 {rows.length} 单（订单利润不含月增重费分摊）</div>

      <div className="list-table-wrap">
        <table className="list-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>归类</th>
              <th>状态</th>
              <th>退款核对净收入</th>
              <th>订单净收入</th>
              <th>商品成本</th>
              <th>运费</th>
              <th>订单利润</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={`order-profit-${item.orderId}`}>
                <td>{item.orderId}</td>
                <td>{item.category}</td>
                <td>{item.statuses}</td>
                <td>
                  ¥ {formatMoney(item.refundReviewNetRevenue || 0)}
                  {item.refundReviewLineCount > 0 ? (
                    <span className="manual-tag">{item.refundReviewLineCount} 行</span>
                  ) : null}
                </td>
                <td>¥ {formatMoney(item.netRevenue || 0)}</td>
                <td>¥ {formatMoney(item.productCost || 0)}</td>
                <td>¥ {formatMoney(item.shippingCost || 0)}</td>
                <td>¥ {formatMoney(item.profit || 0)}</td>
                <td>{item.note || '-'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-row">
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

export default function MatchDetailsPanel({ stats, updateRefundOverride }) {
  return (
    <section className="list-grid">
      <ProductList title="已匹配商品清单" products={stats.matchedProducts || []} matched />
      <ProductList title="未匹配商品清单（待补进货价）" products={stats.unmatchedProducts || []} matched={false} />
      <PendingOrderList rows={stats.pendingOrderRows || []} />
      <RefundReviewList rows={stats.refundReviewOrders || []} updateRefundOverride={updateRefundOverride} />
      <OrderProfitList rows={stats.orderProfitRows || []} />
    </section>
  );
}
