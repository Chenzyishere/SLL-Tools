import { formatMoney } from '../utils/format';

export default function StatsPanel({ stats }) {
  return (
    <section className="result result-4">
      <div className="result-item">
        <span>本月净收入</span>
        <strong>¥ {formatMoney(stats.revenue)}</strong>
        <small>有效订单 {stats.salesCount} 条</small>
      </div>

      <div className="result-item">
        <span>本月总成本</span>
        <strong>¥ {formatMoney(stats.cost)}</strong>
        <small>
          商品成本 {formatMoney(stats.productCost)} + 运费 {formatMoney(stats.shippingCost)} + 增重费 {formatMoney(stats.weightFee)}
        </small>
      </div>

      <div className={`result-item profit ${stats.profit >= 0 ? 'up' : 'down'}`}>
        <span>本月利润</span>
        <strong>¥ {formatMoney(stats.profit)}</strong>
        <small>已排除无效 {stats.invalidCount} 条，待入账 {stats.pendingCount} 条</small>
      </div>

      <div className="result-item">
        <span>退款核对</span>
        <strong>{stats.refundReviewCount} 单</strong>
        <small>退款金额合计 ¥ {formatMoney(stats.refundReviewTotal || 0)}</small>
      </div>
    </section>
  );
}
