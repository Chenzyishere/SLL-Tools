import { useMemo } from 'react';

export default function UploadPanel({ title, rows, onUpload, fields, mapping, onMappingChange, hints }) {
  const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

  return (
    <section className="panel">
      <h2>{title}</h2>
      <label className="file-picker">
        选择文件
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </label>

      <div className="meta">已读取 {rows.length} 行</div>

      {fields.map((field) => (
        <div className="form-row" key={field.key}>
          <span>{field.label}</span>
          <select
            value={mapping[field.key] || ''}
            onChange={(e) => onMappingChange({ ...mapping, [field.key]: e.target.value })}
          >
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
      ))}

      {columns.length > 0 && <div className="hint">自动识别参考：{hints}</div>}
    </section>
  );
}
