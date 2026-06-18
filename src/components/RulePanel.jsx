import CollapsibleSection from './CollapsibleSection';

function updateCost(setCostSettings, key, value) {
  setCostSettings((prev) => ({
    ...prev,
    [key]: Number(value)
  }));
}

export default function RulePanel({ platformPreset, costSettings, setCostSettings }) {
  const showWarehouseFees = Boolean(platformPreset?.warehouseFeesEnabled);
  const showStandardFees = !showWarehouseFees;

  return (
    <section className="sidebar-upload">
      <CollapsibleSection title="费用设置" defaultOpen={false}>
        <div className="sidebar-fees">
          {showStandardFees && (
            <>
              <label>
                <span>基础运费</span>
                <input type="number" min="0" step="0.1" value={costSettings.baseShippingFee}
                  onChange={(e) => updateCost(setCostSettings, 'baseShippingFee', e.target.value)} />
                <span className="fee-unit">元/单</span>
              </label>
              <label>
                <span>体验费</span>
                <input type="number" min="0" step="0.1" value={costSettings.consumerExperienceFee}
                  onChange={(e) => updateCost(setCostSettings, 'consumerExperienceFee', e.target.value)} />
                <span className="fee-unit">元/单</span>
              </label>
              <label>
                <span>技术费率</span>
                <input type="number" min="0" step="0.01" value={(costSettings.techServiceRate || 0) * 100}
                  onChange={(e) => updateCost(setCostSettings, 'techServiceRate', Number(e.target.value) / 100)} />
                <span className="fee-unit">%</span>
              </label>
              <label>
                <span>月增重费</span>
                <input type="number" min="0" step="0.1" value={costSettings.monthlyWeightFee}
                  onChange={(e) => updateCost(setCostSettings, 'monthlyWeightFee', e.target.value)} />
                <span className="fee-unit">元</span>
              </label>
            </>
          )}
          {showWarehouseFees && (
            <>
              <label>
                <span>入仓运费</span>
                <input type="number" min="0" step="0.1" value={costSettings.inboundWarehouseShippingFee || 0}
                  onChange={(e) => updateCost(setCostSettings, 'inboundWarehouseShippingFee', e.target.value)} />
                <span className="fee-unit">元/月</span>
              </label>
              <label>
                <span>退仓运费</span>
                <input type="number" min="0" step="0.1" value={costSettings.outboundWarehouseShippingFee || 0}
                  onChange={(e) => updateCost(setCostSettings, 'outboundWarehouseShippingFee', e.target.value)} />
                <span className="fee-unit">元/月</span>
              </label>
            </>
          )}
        </div>
      </CollapsibleSection>
    </section>
  );
}
