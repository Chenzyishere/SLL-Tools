export default function StatusFilterPanel({ statusRule, setStatusRule, statusOptions, toggleStatus, selectAllStatuses, clearAllStatuses }) {
  return (
    <section className="panel status-panel">
      <h2>有效订单规则（按订单状态）</h2>

      <div className="status-controls">
        <label className="status-toggle">
          <input
            type="checkbox"
            checked={statusRule.enabled}
            onChange={(e) => setStatusRule((prev) => ({ ...prev, enabled: e.target.checked }))}
          />
          启用状态过滤
        </label>

        <label>
          规则模式
          <select
            value={statusRule.mode}
            onChange={(e) => setStatusRule((prev) => ({ ...prev, mode: e.target.value }))}
          >
            <option value="include">仅包含勾选状态</option>
            <option value="exclude">排除勾选状态</option>
          </select>
        </label>
      </div>

      <div className="status-actions">
        <button type="button" onClick={selectAllStatuses}>
          全选
        </button>
        <button type="button" onClick={clearAllStatuses}>
          清空
        </button>
      </div>

      <div className="status-list">
        {statusOptions.map((status) => (
          <label key={status} className="status-chip">
            <input
              type="checkbox"
              checked={statusRule.selectedStatuses.includes(status)}
              onChange={() => toggleStatus(status)}
            />
            <span>{status}</span>
          </label>
        ))}

        {statusOptions.length === 0 && <div className="meta">请先上传销售表并确认订单状态列</div>}
      </div>
    </section>
  );
}
