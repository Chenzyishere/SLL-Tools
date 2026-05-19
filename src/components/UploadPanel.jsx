import { useMemo } from 'react';

export default function UploadPanel({
  title,
  rows,
  fileNames = [],
  onUpload,
  fields,
  mapping,
  onMappingChange,
  hints,
  multiple = false
}) {
  const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

  return (
    <section className="panel upload-panel">
      <div className="panel-title-row">
        <h2>{title}</h2>
        <label className="file-picker">
          选择文件
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple={multiple}
            onChange={(e) => {
              if (multiple) {
                onUpload(e.target.files);
                return;
              }

              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
        </label>
      </div>

      <div className="meta">
        已读取 {rows.length} 行
        {fileNames.length > 0 ? `，${fileNames.length} 个文件` : ''}
      </div>

      {fileNames.length > 0 && (
        <div className="file-list">
          {fileNames.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      )}

      <details className="mapping-details" open={columns.length > 0}>
        <summary>字段确认</summary>

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
      </details>
    </section>
  );
}
