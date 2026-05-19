﻿import { useState } from 'react';
import { formatMoney } from '../utils/format';

function CollapsibleNote({ children }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="collapsible-note">
      <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="expand-btn">
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        {isExpanded ? '收起明细' : '查看明细'}
      </button>
      {isExpanded && <div className="note-content">{children}</div>}
    </div>
  );
}

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
        <CollapsibleNote>
          <div>商品成本：¥ {formatMoney(stats.productCost)}</div>
          <div>运费：¥ {formatMoney(stats.shippingCost)}</div>
          <div>体验提升费：¥ {formatMoney(stats.experienceFeeTotal || 0)}</div>
          <div>技术服务费：¥ {formatMoney(stats.techServiceFeeTotal || 0)}</div>
          <div>月增重费：¥ {formatMoney(stats.weightFee)}</div>
          <div>仓运费：¥ {formatMoney(stats.warehouseFeeTotal || 0)}</div>
        </CollapsibleNote>
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