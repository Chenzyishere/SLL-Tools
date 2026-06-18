import { useCallback, useEffect, useRef, useState } from 'react';

const PRESETS = [
  { label: '自由', ratio: null },
  { label: '1:1', ratio: 1 / 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '3:4', ratio: 3 / 4 },
  { label: '9:16', ratio: 9 / 16 }
];

const HANDLE_SIZE = 12;
const MIN_CROP = 40;

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function fitImageToScreen(imgW, imgH) {
  const maxW = Math.min(window.innerWidth * 0.85, 1000);
  const maxH = Math.min(window.innerHeight * 0.7, 700);
  const scale = Math.min(maxW / imgW, maxH / imgH, 1);
  return { w: Math.round(imgW * scale), h: Math.round(imgH * scale), scale };
}

export default function CropModal({ image, onCrop, onClose }) {
  const canvasRef = useRef(null);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0, scale: 1 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [activePreset, setActivePreset] = useState(0);
  const dragRef = useRef(null);

  // Initialize
  useEffect(() => {
    if (!image) return;
    const size = fitImageToScreen(image.naturalWidth, image.naturalHeight);
    setDisplaySize(size);
    const cw = Math.round(size.w * 0.8);
    const ch = Math.round(size.h * 0.8);
    const cx = Math.round((size.w - cw) / 2);
    const cy = Math.round((size.h - ch) / 2);
    setCrop({ x: cx, y: cy, w: cw, h: ch });
  }, [image]);

  const toReal = useCallback((dc) => {
    const scale = image.naturalWidth / displaySize.w;
    return {
      x: Math.round(dc.x * scale),
      y: Math.round(dc.y * scale),
      w: Math.round(dc.w * scale),
      h: Math.round(dc.h * scale)
    };
  }, [image, displaySize]);

  const ratio = PRESETS[activePreset].ratio;

  function constrainRect(rect) {
    let { x, y, w, h } = rect;
    if (ratio) {
      h = Math.round(w / ratio);
      if (h > displaySize.h) { h = displaySize.h; w = Math.round(h * ratio); }
    }
    if (w > displaySize.w) { w = displaySize.w; if (ratio) h = Math.round(w / ratio); }
    x = clamp(x, 0, displaySize.w - w);
    y = clamp(y, 0, displaySize.h - h);
    return { x, y, w, h };
  }

  // Draw
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs || !displaySize.w) return;
    cvs.width = displaySize.w;
    cvs.height = displaySize.h;
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.drawImage(image, 0, 0, cvs.width, cvs.height);
    // Dim areas outside the crop box
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const { x, y, w, h } = crop;
    ctx.fillRect(0, 0, cvs.width, y);
    ctx.fillRect(0, y + h, cvs.width, cvs.height - y - h);
    ctx.fillRect(0, y, x, h);
    ctx.fillRect(x + w, y, cvs.width - x - w, h);
    // Crop border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
    ctx.setLineDash([]);
    // Handles
    const handles = [
      [crop.x, crop.y], [crop.x + crop.w / 2, crop.y], [crop.x + crop.w, crop.y],
      [crop.x, crop.y + crop.h / 2], [crop.x + crop.w, crop.y + crop.h / 2],
      [crop.x, crop.y + crop.h], [crop.x + crop.w / 2, crop.y + crop.h], [crop.x + crop.w, crop.y + crop.h]
    ];
    for (const [hx, hy] of handles) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(hx - HANDLE_SIZE / 2, hy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(hx - HANDLE_SIZE / 2, hy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    }
  }, [image, displaySize, crop]);

  function getHandle(x, y) {
    const d = 10;
    const { x: cx, y: cy, w, h } = crop;
    const handles = {
      nw: [cx, cy], n: [cx + w / 2, cy], ne: [cx + w, cy],
      w: [cx, cy + h / 2], e: [cx + w, cy + h / 2],
      sw: [cx, cy + h], s: [cx + w / 2, cy + h], se: [cx + w, cy + h]
    };
    for (const [key, [hx, hy]] of Object.entries(handles)) {
      if (Math.abs(x - hx) < d && Math.abs(y - hy) < d) return key;
    }
    if (x > cx && x < cx + w && y > cy && y < cy + h) return 'move';
    return null;
  }

  function onMouseDown(e) {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const handle = getHandle(mx, my);
    if (!handle) return;
    dragRef.current = { handle, startX: mx, startY: my, startCrop: { ...crop } };
  }

  function onMouseMove(e) {
    if (!dragRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { handle, startX, startY, startCrop } = dragRef.current;
    const dx = mx - startX;
    const dy = my - startY;

    let next = { ...startCrop };
    const h = handle;

    if (h === 'move') {
      next.x = clamp(startCrop.x + dx, 0, displaySize.w - startCrop.w);
      next.y = clamp(startCrop.y + dy, 0, displaySize.h - startCrop.h);
    } else {
      const resize = (left, top, right, bottom) => {
        if (left) { next.x = clamp(startCrop.x + dx, 0, startCrop.x + startCrop.w - MIN_CROP); next.w = startCrop.x - next.x + startCrop.w; }
        if (right) { next.w = clamp(startCrop.w + dx, MIN_CROP, displaySize.w - startCrop.x); }
        if (top) { next.y = clamp(startCrop.y + dy, 0, startCrop.y + startCrop.h - MIN_CROP); next.h = startCrop.y - next.y + startCrop.h; }
        if (bottom) { next.h = clamp(startCrop.h + dy, MIN_CROP, displaySize.h - startCrop.y); }
        if (ratio) {
          if (left || right) next.h = Math.round(next.w / ratio);
          else next.w = Math.round(next.h * ratio);
          if (next.w > displaySize.w - next.x) { next.w = displaySize.w - next.x; next.h = Math.round(next.w / ratio); }
          if (next.h > displaySize.h - next.y) { next.h = displaySize.h - next.y; next.w = Math.round(next.h * ratio); }
        }
      };
      if (h === 'nw') resize(true, true, false, false);
      else if (h === 'n') resize(false, true, false, false);
      else if (h === 'ne') resize(false, true, true, false);
      else if (h === 'w') resize(true, false, false, false);
      else if (h === 'e') resize(false, false, true, false);
      else if (h === 'sw') resize(true, false, false, true);
      else if (h === 's') resize(false, false, false, true);
      else if (h === 'se') resize(false, false, true, true);
    }

    next = constrainRect(next);
    setCrop(next);
  }

  function onMouseUp() {
    dragRef.current = null;
  }

  function handlePreset(index) {
    setActivePreset(index);
    const r = PRESETS[index].ratio;
    if (!r) return;
    setCrop((prev) => constrainRect({ ...prev, h: Math.round(prev.w / r) }));
  }

  function handleConfirm() {
    if (!image) return;
    const real = toReal(crop);
    const cvs = document.createElement('canvas');
    cvs.width = real.w;
    cvs.height = real.h;
    const ctx = cvs.getContext('2d');
    ctx.drawImage(image, real.x, real.y, real.w, real.h, 0, 0, real.w, real.h);
    onCrop(cvs);
  }

  return (
    <div className="crop-overlay" onClick={onClose}>
      <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crop-header">
          <h3>裁剪图片</h3>
          <button className="crop-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="crop-presets">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              className={`preset-btn${i === activePreset ? ' active' : ''}`}
              onClick={() => handlePreset(i)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="crop-canvas-wrap">
          <canvas
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ cursor: 'crosshair' }}
          />
        </div>
        <div className="crop-info">
          拖拽移动裁剪框，四角缩放
        </div>
        <div className="crop-actions">
          <button className="secondary-action" onClick={onClose}>取消</button>
          <button className="primary-action" onClick={handleConfirm}>确认裁剪</button>
        </div>
      </div>
    </div>
  );
}
