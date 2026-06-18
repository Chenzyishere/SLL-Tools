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

  const hasData = rows.length > 0;

  return (
    <section className="sidebar-upload">
      <div className="sidebar-upload-header">
        <h4>{title}</h4>
        <label className="sidebar-file-btn">
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
          {hasData ? '更换' : '上传'}
        </label>
      </div>

      {hasData && (
        <div className="sidebar-upload-meta">
          {rows.length} 行
          {fileNames.length > 0 ? ` · ${fileNames.join(', ')}` : ''}
        </div>
      )}
      {!hasData && (
        <div className="sidebar-upload-meta empty">未上传</div>
      )}

      <details className="sidebar-mapping">
        <summary>字段确认</summary>
        {fields.map((field) => (
          <div className="sidebar-form-row" key={field.key}>
            <span>{field.label}</span>
            <select
              value={mapping[field.key] || ''}
              onChange={(e) => onMappingChange({ ...mapping, [field.key]: e.target.value })}
            >
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        ))}
        {columns.length > 0 && <div className="sidebar-hint">{hints}</div>}
      </details>
    </section>
  );
}
