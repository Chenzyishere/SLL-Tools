import { useState } from 'react';
import CollapsibleSection from './CollapsibleSection';

function updateCost(setCostSettings, key, value) {
  setCostSettings((prev) => ({
    ...prev,
    [key]: Number(value)
  }));
}

function CollapsibleRules({ children }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rule-list-wrapper">
      <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="rules-toggle">
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        {isExpanded ? '收起规则说明' : '展开规则说明'}
      </button>
      {isExpanded && (
        <div className="rule-list">
          {children}
        </div>
      )}
    </div>
  );
}

export default function RulePanel({ platformPreset, costSettings, setCostSettings }) {
  const showWarehouseFees = Boolean(platformPreset?.warehouseFeesEnabled);
  const showStandardFees = !showWarehouseFees;

  return (
    <section className="panel status-panel">
      <CollapsibleSection title="规则与费用设置">
        <CollapsibleRules>
          <div>1. 无效订单：状态含"已取消 / 未发货 / 退款成功（且非已发货或已收货）"</div>
          <div>2. 待入账订单：状态含"已发货，待收货"</div>
          {showStandardFees && (
            <>
              <div>3. 运费规则：状态含"已收货"或"已发货，退款成功"按基础运费计 1 单</div>
              <div>4. 消费者体验提升计划费用：仅已收货订单扣款（元/单）</div>
              <div>5. 技术服务费：仅已收货订单扣款（按净收入比例）</div>
              <div>6. 月增重费：按月固定加入总成本</div>
            </>
          )}
          {showWarehouseFees && <div>3. 得物仓运费：入仓运费、退仓运费按月固定加入总成本</div>}
        </CollapsibleRules>

        <div className="status-controls">
          {showStandardFees && (
            <>
              <label>
                基础运费(元/单)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={costSettings.baseShippingFee}
                  onChange={(e) => updateCost(setCostSettings, 'baseShippingFee', e.target.value)}
                />
              </label>

              <label>
                体验提升费(元/单)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={costSettings.consumerExperienceFee}
                  onChange={(e) => updateCost(setCostSettings, 'consumerExperienceFee', e.target.value)}
                />
              </label>

              <label>
                技术服务费率(%)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={(costSettings.techServiceRate || 0) * 100}
                  onChange={(e) => updateCost(setCostSettings, 'techServiceRate', Number(e.target.value) / 100)}
                />
              </label>

              <label>
                月增重费(元)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={costSettings.monthlyWeightFee}
                  onChange={(e) => updateCost(setCostSettings, 'monthlyWeightFee', e.target.value)}
                />
              </label>
            </>
          )}

          {showWarehouseFees && (
            <>
              <label>
                入仓运费(元/月)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={costSettings.inboundWarehouseShippingFee || 0}
                  onChange={(e) => updateCost(setCostSettings, 'inboundWarehouseShippingFee', e.target.value)}
                />
              </label>

              <label>
                退仓运费(元/月)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={costSettings.outboundWarehouseShippingFee || 0}
                  onChange={(e) => updateCost(setCostSettings, 'outboundWarehouseShippingFee', e.target.value)}
                />
              </label>
            </>
          )}
        </div>
      </CollapsibleSection>
    </section>
  );
}