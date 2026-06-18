import { useState } from 'react';
import CollapsibleSection from './CollapsibleSection';

const STATUS_OPTIONS = ['已收货', '已发货', '待收货', '已取消', '退款成功', '未发货'];
const CHANNEL_OPTIONS = ['闲鱼', '线下', '其他'];

const FIELD_KEYS = ['日期', '金额', '数量', '商品名称', '成本', '平台扣费', '状态', '售卖渠道'];

const EMPTY_FORM = {
  date: '',
  amount: '',
  qty: '1',
  name: '',
  cost: '',
  platformFee: '',
  status: '已收货',
  channel: '闲鱼',
  channelDetail: ''
};

let _idSeq = 0;

function parseClipboardText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const delim = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delim).map((h) => h.trim());

  function matchCol(keywords) {
    for (const kw of keywords) {
      const idx = headers.findIndex((h) => h.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  const dateIdx = matchCol(['日期', '时间', '成交']);
  const amountIdx = matchCol(['金额', '收入', '实收', '价格']);
  const qtyIdx = matchCol(['数量', '件数', '件']);
  const nameIdx = matchCol(['商品名称', '商品名', '名称']);
  const costIdx = matchCol(['成本', '进货价', '单价成本']);
  const platformFeeIdx = matchCol(['平台扣费', '扣费', '手续费']);
  const statusIdx = matchCol(['状态']);
  const channelIdx = matchCol(['渠道', '售卖渠道', '销售渠道']);

  if (dateIdx === -1 && amountIdx === -1) return null;

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delim).map((c) => c.trim());
    const row = {
      '日期': dateIdx >= 0 ? (cols[dateIdx] || '') : '',
      '金额': amountIdx >= 0 ? (cols[amountIdx] || '') : '',
      '数量': qtyIdx >= 0 ? (cols[qtyIdx] || '1') : '1',
      '商品名称': nameIdx >= 0 ? (cols[nameIdx] || '') : '',
      '成本': costIdx >= 0 ? (cols[costIdx] || '') : '',
      '平台扣费': platformFeeIdx >= 0 ? (cols[platformFeeIdx] || '') : '',
      '状态': statusIdx >= 0 ? (cols[statusIdx] || '已收货') : '已收货',
      '售卖渠道': channelIdx >= 0 ? (cols[channelIdx] || '闲鱼') : '闲鱼'
    };
    if (!row['日期'] && !row['金额']) continue;
    rows.push(row);
  }

  return rows.length > 0 ? { headers, rows, dateIdx, amountIdx, qtyIdx, nameIdx, costIdx, platformFeeIdx, statusIdx, channelIdx } : null;
}

export default function ManualOrderInput({ rows, onAdd, onDelete, onClear }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [batchText, setBatchText] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);
  const [parseError, setParseError] = useState('');

  function updateField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'channel' && value !== '其他') {
        next.channelDetail = '';
      }
      return next;
    });
  }

  function handleAdd() {
    if (!form.date.trim() || !form.amount.trim()) return;

    _idSeq += 1;
    const channelLabel = form.channel === '其他' && form.channelDetail.trim()
      ? `其他-${form.channelDetail.trim()}`
      : form.channel;

    const newRow = {
      '日期': form.date.trim(),
      '金额': form.amount.trim(),
      '数量': form.qty.trim() || '1',
      '商品名称': form.name.trim(),
      '成本': form.cost.trim(),
      '平台扣费': form.platformFee.trim(),
      '状态': form.status,
      '售卖渠道': channelLabel,
      '订单号': `MAN-${Date.now()}-${_idSeq}`,
      'SKU': ''
    };

    onAdd([newRow]);
    setForm((prev) => ({
      ...EMPTY_FORM,
      date: prev.date,
      status: prev.status,
      channel: prev.channel,
      channelDetail: prev.channel === '其他' ? '' : prev.channelDetail
    }));
  }

  function handleParse() {
    setParseError('');
    const result = parseClipboardText(batchText);
    if (!result) {
      setParseError('未能解析数据，请确保粘贴的内容包含表头和至少一行数据（支持 Tab 或逗号分隔）');
      setParsedPreview(null);
      return;
    }
    const baseTs = Date.now();
    result.rows.forEach((row, i) => {
      row['订单号'] = `MAN-${baseTs}-${i}`;
      row['SKU'] = '';
    });
    setParsedPreview(result);
  }

  function handleConfirmBatch() {
    if (!parsedPreview || !parsedPreview.rows.length) return;
    _idSeq += parsedPreview.rows.length;
    onAdd(parsedPreview.rows);
    setBatchText('');
    setParsedPreview(null);
  }

  function handleCancelBatch() {
    setParsedPreview(null);
  }

  const canAdd = form.date.trim() && form.amount.trim();
  const hasOrders = rows.length > 0;
  const idxMap = { dateIdx: 0, amountIdx: 1, qtyIdx: 2, nameIdx: 3, costIdx: 4, platformFeeIdx: 5, statusIdx: 6, channelIdx: 7 };

  return (
    <section className="panel manual-order-panel">
      <h2>手动订单录入</h2>

      <CollapsibleSection title="逐条录入" meta={`已录入 ${rows.length} 条`} defaultOpen>
        <div className="manual-order-form">
          <div className="manual-form-row">
            <label className="manual-form-field">
              <span>日期 *</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
              />
            </label>
            <label className="manual-form-field">
              <span>金额 *</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
            </label>
            <label className="manual-form-field">
              <span>数量</span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.qty}
                onChange={(e) => updateField('qty', e.target.value)}
              />
            </label>
            <label className="manual-form-field">
              <span>商品名称</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="可选"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
            </label>
            <label className="manual-form-field">
              <span>成本(单价)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => updateField('cost', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
            </label>
            <label className="manual-form-field">
              <span>平台扣费</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.platformFee}
                onChange={(e) => updateField('platformFee', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
            </label>
            <label className="manual-form-field">
              <span>状态</span>
              <select value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="manual-form-field">
              <span>售卖渠道</span>
              <select value={form.channel} onChange={(e) => updateField('channel', e.target.value)}>
                {CHANNEL_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            {form.channel === '其他' && (
              <label className="manual-form-field">
                <span>渠道名称</span>
                <input
                  type="text"
                  value={form.channelDetail}
                  onChange={(e) => updateField('channelDetail', e.target.value)}
                  placeholder="请输入渠道名称"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                />
              </label>
            )}
            <button
              type="button"
              className="primary-action manual-add-btn"
              disabled={!canAdd}
              onClick={handleAdd}
            >
              添加
            </button>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="批量粘贴" meta={parsedPreview ? `识别 ${parsedPreview.rows.length} 条` : ''} defaultOpen>
        <div className="manual-order-batch">
          <textarea
            className="batch-textarea"
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder="从 Excel 或表格复制数据并粘贴到这里&#10;第一行应为表头（日期、金额、商品名称等）&#10;支持 Tab 或逗号分隔"
            rows={6}
          />
          {parseError && <div className="batch-error">{parseError}</div>}
          <div className="batch-actions">
            <button type="button" className="secondary-action" onClick={handleParse} disabled={!batchText.trim()}>
              解析预览
            </button>
          </div>

          {parsedPreview && (
            <div className="batch-preview">
              <div className="batch-preview-header">
                <span>识别到 {parsedPreview.rows.length} 条订单</span>
                <span className="batch-column-hint">
                  匹配列：{FIELD_KEYS.filter((k) => {
                    const key = Object.keys(idxMap).find(kk => FIELD_KEYS[idxMap[kk]] === k);
                    return key && parsedPreview[key] >= 0;
                  }).join('、')}
                </span>
              </div>
              <div className="list-table-wrap batch-preview-table">
                <table className="list-table">
                  <thead>
                    <tr>
                      {FIELD_KEYS.map((k) => (
                        <th key={k}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedPreview.rows.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {FIELD_KEYS.map((k) => (
                          <td key={k}>{row[k] || '-'}</td>
                        ))}
                      </tr>
                    ))}
                    {parsedPreview.rows.length > 5 && (
                      <tr>
                        <td colSpan={FIELD_KEYS.length} className="empty-row">
                          ... 还有 {parsedPreview.rows.length - 5} 条
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="batch-confirm-actions">
                <button type="button" className="primary-action" onClick={handleConfirmBatch}>
                  确认导入 {parsedPreview.rows.length} 条
                </button>
                <button type="button" className="secondary-action" onClick={handleCancelBatch}>
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      <div className="manual-order-list">
        <div className="panel-title-row">
          <h3>已录入订单</h3>
          <span className="meta">
            共 {rows.length} 条
            {hasOrders && (
              <button type="button" className="clear-data-btn manual-clear-btn" onClick={() => { if (confirm('确定清空所有手动订单？')) onClear(); }}>
                清空全部
              </button>
            )}
          </span>
        </div>

        <div className="list-table-wrap">
          <table className="list-table">
            <thead>
              <tr>
                <th>#</th>
                <th>日期</th>
                <th>金额</th>
                <th>数量</th>
                <th>商品名称</th>
                <th>成本(单价)</th>
                <th>平台扣费</th>
                <th>状态</th>
                <th>售卖渠道</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`manual-${i}`}>
                  <td>{i + 1}</td>
                  <td>{row['日期'] || '-'}</td>
                  <td>¥ {Number(row['金额'] || 0).toFixed(2)}</td>
                  <td>{row['数量'] || '1'}</td>
                  <td>{row['商品名称'] || '-'}</td>
                  <td>{row['成本'] ? `¥ ${Number(row['成本']).toFixed(2)}` : '-'}</td>
                  <td>{row['平台扣费'] ? `¥ ${Number(row['平台扣费']).toFixed(2)}` : '-'}</td>
                  <td>{row['状态'] || '-'}</td>
                  <td>{row['售卖渠道'] || '-'}</td>
                  <td>
                    <button type="button" className="clear-data-btn" onClick={() => onDelete(i)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="empty-row">
                    暂无手动订单，请通过上方表单或批量粘贴录入
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
