export default function RulePanel({ costSettings, setCostSettings }) {
  return (
    <section className="panel status-panel">
      <h2>规则与费用设置</h2>

      <div className="rule-list">
        <div>1. 无效订单：状态含“已取消 / 未发货 / 退款成功（且非已发货或已收货）”</div>
        <div>2. 待入账订单：状态含“已发货，待收货”</div>
        <div>3. 运费规则：状态含“已收货”或“已发货，退款成功”按基础运费计 1 单</div>
        <div>4. 消费者体验提升计划费用：仅已收货订单扣款（元/单）</div>
        <div>5. 技术服务费：仅已收货订单扣款（按净收入比例）</div>
        <div>6. 增重费：按月固定加入总成本</div>
      </div>

      <div className="status-controls">
        <label>
          基础运费(元/单)
          <input
            type="number"
            min="0"
            step="0.1"
            value={costSettings.baseShippingFee}
            onChange={(e) =>
              setCostSettings((prev) => ({
                ...prev,
                baseShippingFee: Number(e.target.value)
              }))
            }
          />
        </label>

        <label>
          体验提升费(元/单)
          <input
            type="number"
            min="0"
            step="0.1"
            value={costSettings.consumerExperienceFee}
            onChange={(e) =>
              setCostSettings((prev) => ({
                ...prev,
                consumerExperienceFee: Number(e.target.value)
              }))
            }
          />
        </label>

        <label>
          技术服务费率(%)
          <input
            type="number"
            min="0"
            step="0.01"
            value={(costSettings.techServiceRate || 0) * 100}
            onChange={(e) =>
              setCostSettings((prev) => ({
                ...prev,
                techServiceRate: Number(e.target.value) / 100
              }))
            }
          />
        </label>

        <label>
          月增重费(元)
          <input
            type="number"
            min="0"
            step="0.1"
            value={costSettings.monthlyWeightFee}
            onChange={(e) =>
              setCostSettings((prev) => ({
                ...prev,
                monthlyWeightFee: Number(e.target.value)
              }))
            }
          />
        </label>
      </div>
    </section>
  );
}
