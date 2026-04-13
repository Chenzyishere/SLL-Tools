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
          商品 {formatMoney(stats.productCost)} + 运费 {formatMoney(stats.shippingCost)} + 体验费 {formatMoney(stats.experienceFeeTotal || 0)} + 服务费 {formatMoney(stats.techServiceFeeTotal || 0)} + 增重费 {formatMoney(stats.weightFee)}
        </small>
      </div>

      <div className={`result-item profit ${stats.profit >= 0 ? 'up' : 'down'}`}>
        <span>本月利润</span>
        <strong>¥ {formatMoney(stats.profit)}</strong>
        <small>已排除无效 {stats.invalidCount} 条，待入账 {stats.pendingCount} 条</small>
      </div>

      <div className="result-item">
        <span>手工退款</span>
        <strong>{stats.orderRefundEditedCount || 0} 单</strong>
        <small>退款金额合计 ¥ {formatMoney(stats.refundTotal || 0)}</small>
      </div>
    </section>
  );
}
