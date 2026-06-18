import { useCallback, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import CropModal from './CropModal';

const POSITIONS = ['左上', '右上', '居中', '左下', '右下', '平铺'];

const PADDING = 24;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function applyWatermark(originalImage, watermarkImage, position, opacity, scale) {
  const w = originalImage.naturalWidth;
  const h = originalImage.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(originalImage, 0, 0, w, h);

  const wmW = Math.round(Math.min(w, h) * (scale / 100));
  const wmH = Math.round((watermarkImage.naturalHeight / watermarkImage.naturalWidth) * wmW) || wmW;

  ctx.globalAlpha = opacity / 100;

  if (position === '平铺') {
    const pattern = ctx.createPattern(watermarkImage, 'repeat');
    if (pattern) {
      // Scale the pattern by drawing via an intermediate small canvas
      const pc = document.createElement('canvas');
      pc.width = wmW;
      pc.height = wmH;
      const pctx = pc.getContext('2d');
      pctx.drawImage(watermarkImage, 0, 0, wmW, wmH);
      const scaledPattern = ctx.createPattern(pc, 'repeat');
      if (scaledPattern) {
        ctx.fillStyle = scaledPattern;
        ctx.fillRect(0, 0, w, h);
      }
    }
  } else {
    let x, y;
    switch (position) {
      case '左上': x = PADDING; y = PADDING; break;
      case '右上': x = w - wmW - PADDING; y = PADDING; break;
      case '左下': x = PADDING; y = h - wmH - PADDING; break;
      case '右下': x = w - wmW - PADDING; y = h - wmH - PADDING; break;
      case '居中':
      default: x = (w - wmW) / 2; y = (h - wmH) / 2; break;
    }
    ctx.drawImage(watermarkImage, x, y, wmW, wmH);
  }

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function canvasToImage(canvas) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = canvas.toDataURL('image/png');
  });
}

export default function WatermarkTool() {
  const [images, setImages] = useState([]);
  const [watermarkFile, setWatermarkFile] = useState(null);
  const [watermarkImg, setWatermarkImg] = useState(null);
  const [position, setPosition] = useState('居中');
  const [opacity, setOpacity] = useState(100);
  const [scale, setScale] = useState(100);
  const [processing, setProcessing] = useState(false);
  const [cropTarget, setCropTarget] = useState(null); // { type: 'image', index } | { type: 'watermark' }
  const previewRef = useRef(null);
  const previewImgRef = useRef(null);
  const wmPreviewRef = useRef(null);

  const redraw = useCallback(() => {
    const canvas = previewRef.current;
    const img = previewImgRef.current;
    if (!canvas || !img || !watermarkImg) return;
    const result = applyWatermark(img, watermarkImg, position, opacity, scale);
    const ctx = canvas.getContext('2d');
    // Resize preview canvas to fit container
    const maxW = Math.min(result.width, 1000);
    const ratio = maxW / result.width;
    canvas.width = maxW;
    canvas.height = Math.round(result.height * ratio);
    ctx.drawImage(result, 0, 0, canvas.width, canvas.height);
  }, [watermarkImg, position, opacity, scale]);

  useEffect(() => { redraw(); }, [redraw]);

  // Watermark-only preview
  useEffect(() => {
    const canvas = wmPreviewRef.current;
    if (!canvas || !watermarkImg) return;
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    // Checkered background
    const cs = 12;
    for (let r = 0; r < size / cs; r++) {
      for (let c = 0; c < size / cs; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#f0f0f0' : '#fff';
        ctx.fillRect(c * cs, r * cs, cs, cs);
      }
    }
    // Draw watermark centered with current opacity
    const maxDim = Math.min(size * 0.7, size * (scale / 100));
    const wmW = Math.min(maxDim, watermarkImg.naturalWidth);
    const wmH = Math.round((watermarkImg.naturalHeight / watermarkImg.naturalWidth) * wmW) || wmW;
    ctx.globalAlpha = opacity / 100;
    ctx.drawImage(watermarkImg, (size - wmW) / 2, (size - wmH) / 2, wmW, wmH);
    ctx.globalAlpha = 1;
  }, [watermarkImg, opacity, scale]);

  async function handleImageUpload(files) {
    const fileList = Array.from(files || []);
    const loaded = await Promise.all(fileList.map(async (file) => {
      const img = await loadImage(file);
      return {
        file,
        img,
        url: URL.createObjectURL(file),
        width: img.naturalWidth,
        height: img.naturalHeight
      };
    }));
    setImages((prev) => [...prev, ...loaded]);
    if (!previewImgRef.current && loaded.length > 0) {
      previewImgRef.current = loaded[0].img;
    }
  }

  function removeImage(index) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (previewImgRef.current === prev[index]?.img) {
        previewImgRef.current = next[0]?.img || null;
      }
      URL.revokeObjectURL(prev[index].url);
      return next;
    });
  }

  async function handleWatermarkUpload(file) {
    if (!file) return;
    setWatermarkFile(file);
    const img = await loadImage(file);
    setWatermarkImg(img);
  }

  function selectPreview(img) {
    previewImgRef.current = img;
    redraw();
  }

  async function handleCropImage(index) {
    setCropTarget({ type: 'image', index });
  }

  async function handleCropWatermark() {
    setCropTarget({ type: 'watermark' });
  }

  async function handleCropResult(canvas) {
    const img = await canvasToImage(canvas);
    const url = canvas.toDataURL('image/png');

    if (cropTarget.type === 'watermark') {
      setWatermarkImg(img);
      const blob = await canvasToBlob(canvas);
      setWatermarkFile((prev) => prev ? new File([blob], prev.name, { type: 'image/png' }) : null);
    } else if (cropTarget.type === 'image') {
      setImages((prev) => {
        const next = [...prev];
        const idx = cropTarget.index;
        URL.revokeObjectURL(next[idx].url);
        next[idx] = {
          ...next[idx],
          img,
          url,
          width: img.naturalWidth,
          height: img.naturalHeight
        };
        if (previewImgRef.current === prev[idx].img) {
          previewImgRef.current = img;
        }
        return next;
      });
    }

    setCropTarget(null);
  }

  const cropImage = cropTarget?.type === 'image' && cropTarget?.index != null ? images[cropTarget.index]?.img : null;
  const cropWmImg = cropTarget?.type === 'watermark' ? watermarkImg : null;

  async function handleDownloadSingle() {
    if (!previewImgRef.current || !watermarkImg) return;
    const canvas = applyWatermark(previewImgRef.current, watermarkImg, position, opacity, scale);
    const blob = await canvasToBlob(canvas);
    downloadBlob(blob, `watermarked-${Date.now()}.png`);
  }

  async function handleDownloadAll() {
    if (!watermarkImg || images.length === 0) return;
    setProcessing(true);
    const zip = new JSZip();
    for (const item of images) {
      const canvas = applyWatermark(item.img, watermarkImg, position, opacity, scale);
      const blob = await canvasToBlob(canvas);
      const name = item.file.name.replace(/\.\w+$/, '') + '_watermarked.png';
      zip.file(name, blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `watermarked-images-${Date.now()}.zip`);
    setProcessing(false);
  }

  const hasImages = images.length > 0;
  const hasWatermark = !!watermarkImg;
  const canProcess = hasImages && hasWatermark;

  return (
    <main className="app watermark-tool">
      {/* Left column: controls */}
      <div className="watermark-left">
        <div className="watermark-panel">
          <h3>上传原图</h3>
          <label className="watermark-upload-zone">
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleImageUpload(e.target.files)}
            />
            <span className="watermark-upload-icon">📷</span>
            <span>{hasImages ? `已选 ${images.length} 张` : '点击或拖拽上传图片（可多选）'}</span>
          </label>

          {hasImages && (
            <div className="watermark-thumb-scroll">
              {images.map((item, i) => (
                <div
                  key={i}
                  className={`watermark-thumb ${previewImgRef.current === item.img ? 'active' : ''}`}
                  onClick={() => selectPreview(item.img)}
                >
                  <img src={item.url} alt={item.file.name} />
                  <div className="watermark-thumb-actions">
                    <button className="watermark-thumb-crop" onClick={(e) => { e.stopPropagation(); handleCropImage(i); }}>✂</button>
                    <button className="watermark-thumb-remove" onClick={(e) => { e.stopPropagation(); removeImage(i); }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="watermark-panel">
          <h3>上传水印图</h3>
          <label className="watermark-upload-zone">
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleWatermarkUpload(e.target.files?.[0])}
            />
            <span className="watermark-upload-icon">🏷️</span>
            <span>{watermarkFile ? watermarkFile.name : '点击上传水印图（单张）'}</span>
          </label>
          {watermarkFile && (
            <div className="watermark-actions-row">
              <button type="button" className="secondary-action" onClick={handleCropWatermark}>裁剪水印</button>
              <button type="button" className="secondary-action" onClick={() => { setWatermarkFile(null); setWatermarkImg(null); }}>
                移除水印
              </button>
            </div>
          )}
          {watermarkImg && (
            <div className="watermark-wm-preview">
              <span className="watermark-wm-preview-label">水印预览</span>
              <canvas ref={wmPreviewRef} className="watermark-wm-canvas" />
            </div>
          )}
        </div>

        <div className="watermark-settings-inline">
          <div className="watermark-settings-row">
            <label>
              <span>位置</span>
              <select value={position} onChange={(e) => setPosition(e.target.value)}>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label>
              <span>透明度</span>
              <div className="watermark-slider-row">
                <input type="range" min="5" max="100" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
                <span className="watermark-slider-val">{opacity}%</span>
              </div>
            </label>
            <label>
              <span>大小</span>
              <div className="watermark-slider-row">
                <input type="range" min="5" max="100" value={scale} onChange={(e) => setScale(Number(e.target.value))} />
                <span className="watermark-slider-val">{scale}%</span>
              </div>
            </label>
          </div>
        </div>

        {canProcess && (
          <div className="watermark-actions">
            <button className="primary-action" onClick={handleDownloadSingle} disabled={processing}>
              下载当前预览图
            </button>
            {images.length > 1 && (
              <button className="primary-action" onClick={handleDownloadAll} disabled={processing}>
                {processing ? '打包中...' : `批量下载 ${images.length} 张 (ZIP)`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right column: preview */}
      <div className="watermark-right">
        {canProcess ? (
          <div className="watermark-preview">
            <h3>
              预览
              <button type="button" className="secondary-action watermark-crop-preview-btn" onClick={() => {
                const idx = images.findIndex((item) => item.img === previewImgRef.current);
                if (idx !== -1) handleCropImage(idx);
              }}>裁剪当前图</button>
            </h3>
            <div className="watermark-canvas-wrap">
              <canvas ref={previewRef} />
            </div>
          </div>
        ) : (
          <div className="watermark-preview-empty">
            <span className="watermark-upload-icon">🖼️</span>
            <p>上传原图和水印图后<br/>在此处预览效果</p>
          </div>
        )}
      </div>

      {cropTarget && (
        <CropModal
          image={cropImage || cropWmImg}
          onCrop={handleCropResult}
          onClose={() => setCropTarget(null)}
        />
      )}
    </main>
  );
}
