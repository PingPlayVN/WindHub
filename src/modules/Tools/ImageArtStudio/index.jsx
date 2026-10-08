import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Code2,
  Copy,
  Download,
  FileImage,
  FileText,
  Image,
  LoaderCircle,
  Maximize2,
  Palette,
  RotateCcw,
  Save,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { RAMPS, renderArt } from './renderArt.js';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_SOURCE_PIXELS = 40_000_000;
const MAX_OUTPUT_CELLS = 57_600;

const DEFAULT_SETTINGS = {
  mode: 'classic',
  columns: 100,
  autoHeight: true,
  rows: 80,
  characters: '@%#*+=-:. ',
  blockStyle: 'shade',
  brightness: 0,
  contrast: 0,
  gamma: 1,
  exposure: 0,
  saturation: 100,
  thresholdEnabled: false,
  threshold: 128,
  invert: false,
  blur: 0,
  sharpness: 0,
  edgeThreshold: 24,
  edgeStrength: 1.5,
  brailleThreshold: 128,
  blockThreshold: 128,
  ditherAlgorithm: 'floyd-steinberg',
  ditherStrength: 75,
  cropAspect: 'original',
  fitMode: 'cover',
  zoom: 1,
  panX: 50,
  panY: 50,
  characterAspectPreset: 'terminal',
  characterAspect: 0.52,
  foreground: '#e8edf2',
  background: '#090d12',
  fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
  fontSize: 12,
  padding: 20,
  lineHeight: 1.15,
  characterSpacing: 0,
};

const PRESETS = [
  { name: 'Classic', settings: { mode: 'classic', characters: '@%#*+=-:. ' } },
  { name: 'Dense', settings: { mode: 'dense' } },
  { name: 'Minimal', settings: { mode: 'classic', characters: '#*:. ' } },
  { name: 'Retro Terminal', settings: { mode: 'custom', characters: 'WIND 01', foreground: '#7cff82', background: '#071009' } },
  { name: 'Braille', settings: { mode: 'braille' } },
  { name: 'Blocks', settings: { mode: 'block', blockStyle: 'half' } },
  { name: 'High Contrast', settings: { mode: 'classic', thresholdEnabled: true, threshold: 128, contrast: 25 } },
  { name: 'Edge', settings: { mode: 'edge' } },
  { name: 'Dither', settings: { mode: 'dither', ditherAlgorithm: 'floyd-steinberg' } },
  { name: 'Color ASCII', settings: { mode: 'color' } },
];

const FONT_STACKS = [
  'ui-monospace, SFMono-Regular, Consolas, monospace',
  "'JetBrains Mono', monospace",
  'monospace',
];

const MODE_OPTIONS = [
  ['classic', 'Classic ASCII'],
  ['dense', 'Dense ASCII'],
  ['unicode', 'Unicode'],
  ['braille', 'Braille'],
  ['block', 'Block'],
  ['edge', 'Edge'],
  ['dither', 'Dithered'],
  ['color', 'Colored ASCII'],
  ['custom', 'Custom characters'],
];

const RANGE_CLASS = 'w-full accent-orange-500';
const CONTROL_CLASS = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-orange-500 dark:border-slate-700 dark:bg-black dark:text-slate-100';
const BUTTON_CLASS = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-orange-400 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:text-orange-300';

function createSampleFile() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 560;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Không thể tạo ảnh mẫu trong trình duyệt.');

  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#10233f');
  sky.addColorStop(1, '#f18c55');
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffe8ab';
  context.beginPath();
  context.arc(590, 180, 74, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#26384a';
  context.beginPath();
  context.moveTo(0, 400);
  context.lineTo(180, 180);
  context.lineTo(330, 370);
  context.lineTo(452, 240);
  context.lineTo(800, 560);
  context.lineTo(0, 560);
  context.fill();
  context.fillStyle = '#101c2c';
  context.beginPath();
  context.moveTo(0, 465);
  context.lineTo(230, 295);
  context.lineTo(410, 485);
  context.lineTo(565, 340);
  context.lineTo(800, 470);
  context.lineTo(800, 560);
  context.lineTo(0, 560);
  context.fill();
  context.fillStyle = '#0a121e';
  context.fillRect(0, 510, 800, 50);

  const blob = new Promise((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Không thể tạo ảnh mẫu.')), 'image/png');
  });
  return blob.then((value) => new File([value], 'windhub-sample-landscape.png', { type: 'image/png' }));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function getAspectRatio(source, cropAspect) {
  if (cropAspect === 'free') return source.width / source.height;
  if (cropAspect === '1:1') return 1;
  if (cropAspect === '4:3') return 4 / 3;
  if (cropAspect === '16:9') return 16 / 9;
  if (cropAspect === '9:16') return 9 / 16;
  return source.width / source.height;
}

function getCropRect(width, height, ratio, zoom, panX, panY, fitMode) {
  if (fitMode === 'contain') return { x: 0, y: 0, width, height, contain: true };
  let cropWidth = width;
  let cropHeight = height;
  if (width / height > ratio) cropWidth = height * ratio;
  else cropHeight = width / ratio;
  cropWidth /= zoom;
  cropHeight /= zoom;
  const x = (width - cropWidth) * (panX / 100);
  const y = (height - cropHeight) * (panY / 100);
  return { x, y, width: cropWidth, height: cropHeight, contain: false };
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  try {
    textarea.focus();
    textarea.select();
    if (!document.execCommand('copy')) throw new Error('Clipboard is unavailable.');
  } finally {
    textarea.remove();
  }
}

function ImageArtStudio() {
  const uploadRef = useRef(null);
  const resultCanvasRef = useRef(null);
  const previewPanelRef = useRef(null);
  const workerRef = useRef(null);
  const renderTimerRef = useRef(null);
  const requestIdRef = useRef(0);
  const selectionIdRef = useRef(0);
  const objectUrlRef = useRef(null);
  const mountedRef = useRef(true);
  const settingsRef = useRef(DEFAULT_SETTINGS);
  const [source, setSource] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [wrap, setWrap] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [customPresets, setCustomPresets] = useState(() => {
    try {
      const value = JSON.parse(localStorage.getItem('windhub-image-art-presets') || '[]');
      return Array.isArray(value) ? value.filter((entry) => typeof entry.name === 'string' && entry.settings) : [];
    } catch {
      return [];
    }
  });
  const selectedFontPreset = FONT_STACKS.includes(settings.fontFamily) ? settings.fontFamily : 'custom';
  const imageUrl = source?.url || '';

  const updateSettings = useCallback((changes) => {
    setSettings((current) => {
      const next = { ...current, ...changes };
      settingsRef.current = next;
      return next;
    });
  }, []);

  const cancelRender = useCallback(() => {
    requestIdRef.current += 1;
    window.clearTimeout(renderTimerRef.current);
    renderTimerRef.current = null;
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setProcessing(false);
  }, []);

  const selectFile = useCallback(async (file) => {
    if (!file) return;
    const selectionId = ++selectionIdRef.current;
    if (!file.type.startsWith('image/')) {
      setError('Hãy chọn tệp ảnh PNG, JPG, WEBP, GIF hoặc BMP.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Ảnh vượt quá giới hạn 20 MB. Hãy chọn ảnh nhỏ hơn.');
      return;
    }
    if (typeof createImageBitmap !== 'function') {
      setError('Trình duyệt này chưa hỗ trợ giải mã ảnh. Hãy thử dùng trình duyệt mới hơn.');
      return;
    }
    setError('');
    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      if (selectionId !== selectionIdRef.current) return;
      if (width * height > MAX_SOURCE_PIXELS) {
        throw new Error('Ảnh có độ phân giải quá lớn (trên 40 megapixel). Hãy giảm kích thước ảnh trước.');
      }
      if (!mountedRef.current) return;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setSource({ file, width, height, url });
      setResult(null);
      if (uploadRef.current) uploadRef.current.value = '';
    } catch (imageError) {
      setError(imageError.message?.includes('quá lớn')
        ? imageError.message
        : 'Không đọc được ảnh này. Hãy thử file PNG, JPG, WEBP, GIF hoặc BMP khác.');
    }
  }, []);

  const handlePaste = useCallback((event) => {
    const imageItem = Array.from(event.clipboardData?.items || []).find((item) => item.type.startsWith('image/'));
    const file = imageItem?.getAsFile();
    if (!file) return;
    event.preventDefault();
    void selectFile(file);
  }, [selectFile]);

  const loadSample = async () => {
    try {
      await selectFile(await createSampleFile());
    } catch (sampleError) {
      setError(sampleError.message || 'Không thể tạo ảnh mẫu.');
    }
  };

  const removeImage = () => {
    cancelRender();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setSource(null);
    setResult(null);
    setError('');
  };

  useEffect(() => {
    mountedRef.current = true;
    const handleWindowPaste = (event) => handlePaste(event);
    window.addEventListener('paste', handleWindowPaste);
    return () => {
      window.removeEventListener('paste', handleWindowPaste);
      workerRef.current?.terminate();
      mountedRef.current = false;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [handlePaste]);

  useEffect(() => {
    if (!source) return undefined;
    const currentRequestId = ++requestIdRef.current;
    renderTimerRef.current = window.setTimeout(async () => {
      renderTimerRef.current = null;
      setProcessing(true);
      setError('');
      try {
        if (!('Worker' in window) || !('createImageBitmap' in window)) {
          throw new Error('Trình duyệt này chưa hỗ trợ xử lý ảnh trong nền.');
        }
        const bitmap = await createImageBitmap(source.file);
        if (currentRequestId !== requestIdRef.current) {
          bitmap.close();
          return;
        }
        const currentSettings = settingsRef.current;
        const columns = Math.min(240, Math.max(20, Number(currentSettings.columns) || 100));
        const targetRatio = getAspectRatio(source, currentSettings.cropAspect);
        let rows = currentSettings.autoHeight
          ? Math.max(1, Math.round(columns / targetRatio * currentSettings.characterAspect))
          : Math.min(240, Math.max(1, Number(currentSettings.rows) || 80));
        if (columns * rows > MAX_OUTPUT_CELLS) rows = Math.max(1, Math.floor(MAX_OUTPUT_CELLS / columns));
        rows = Math.min(240, rows);
        const scaleX = currentSettings.mode === 'braille' ? 2 : 1;
        const scaleY = currentSettings.mode === 'braille' ? 4 : currentSettings.mode === 'block' && currentSettings.blockStyle === 'half' ? 2 : 1;
        const pixelWidth = columns * scaleX;
        const pixelHeight = rows * scaleY;
        const raster = document.createElement('canvas');
        raster.width = pixelWidth;
        raster.height = pixelHeight;
        const context = raster.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Không thể khởi tạo xử lý ảnh trong trình duyệt.');
        context.fillStyle = currentSettings.background;
        context.fillRect(0, 0, pixelWidth, pixelHeight);
        try {
          const crop = getCropRect(
            bitmap.width,
            bitmap.height,
            targetRatio,
            currentSettings.zoom,
            currentSettings.panX,
            currentSettings.panY,
            currentSettings.fitMode,
          );
          if (crop.contain) {
            const factor = Math.min(pixelWidth / bitmap.width, pixelHeight / bitmap.height);
            const drawWidth = bitmap.width * factor;
            const drawHeight = bitmap.height * factor;
            context.drawImage(bitmap, (pixelWidth - drawWidth) / 2, (pixelHeight - drawHeight) / 2, drawWidth, drawHeight);
          } else {
            context.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, pixelWidth, pixelHeight);
          }
        } finally {
          bitmap.close();
        }
        const imageData = context.getImageData(0, 0, pixelWidth, pixelHeight);
        const renderSettings = { ...currentSettings, columns, rows };
        const worker = new Worker(new URL('./render.worker.js', import.meta.url), { type: 'module' });
        workerRef.current?.terminate();
        workerRef.current = worker;
        worker.onmessage = (event) => {
          if (event.data.requestId !== currentRequestId || currentRequestId !== requestIdRef.current) return;
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
          if (event.data.error) {
            setError(event.data.error);
            setProcessing(false);
            return;
          }
          setResult({
            ...event.data.result,
            colors: new Uint8ClampedArray(event.data.colors),
          });
          setProcessing(false);
        };
        worker.onerror = (workerError) => {
          workerError.preventDefault();
          if (currentRequestId !== requestIdRef.current) return;
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
          try {
            setResult(renderArt(imageData.data, pixelWidth, pixelHeight, renderSettings));
            toast.warning('Trình duyệt không chạy được Worker; ảnh nhỏ đã được xử lý trực tiếp trên thiết bị.');
          } catch (fallbackError) {
            setError(`Không thể xử lý ảnh: ${fallbackError.message || workerError.message || 'Worker bị lỗi.'}`);
          } finally {
            setProcessing(false);
          }
        };
        worker.postMessage({
          requestId: currentRequestId,
          pixels: imageData.data.buffer,
          pixelWidth,
          pixelHeight,
          settings: renderSettings,
        });
      } catch (renderError) {
        if (currentRequestId === requestIdRef.current) {
          setProcessing(false);
          setError(renderError.message || 'Không thể chuyển đổi ảnh.');
        }
      }
    }, 140);
    return () => {
      window.clearTimeout(renderTimerRef.current);
      renderTimerRef.current = null;
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [source, settings, cancelRender]);

  useEffect(() => {
    if (!result || !resultCanvasRef.current) return;
    const canvas = resultCanvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    const fontFamily = settings.fontFamily || DEFAULT_SETTINGS.fontFamily;
    context.font = `${settings.fontSize}px ${fontFamily}`;
    const cellWidth = Math.max(settings.fontSize * 0.6, context.measureText('M').width) + Number(settings.characterSpacing || 0);
    const width = Math.ceil(settings.padding * 2 + result.columns * cellWidth);
    const height = Math.ceil(settings.padding * 2 + result.rows * settings.fontSize * settings.lineHeight);
    if (width > 8192 || height > 8192 || width * height > 24_000_000) {
      setError('Bản xem trước vượt giới hạn kích thước. Hãy giảm cỡ chữ hoặc chiều rộng ASCII.');
      return;
    }
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = settings.background;
    context.fillRect(0, 0, width, height);
    context.font = `${settings.fontSize}px ${fontFamily}`;
    context.textBaseline = 'top';
    context.textAlign = 'left';
    context.imageSmoothingEnabled = false;
    const colored = settings.mode === 'color';
    const lines = result.text.split('\n');
    for (let y = 0; y < lines.length; y += 1) {
      const line = Array.from(lines[y]);
      const top = settings.padding + y * settings.fontSize * settings.lineHeight;
      for (let x = 0; x < line.length; x += 1) {
        const index = y * result.columns + x;
        const colorIndex = index * 3;
        context.fillStyle = colored
          ? `rgb(${result.colors[colorIndex]} ${result.colors[colorIndex + 1]} ${result.colors[colorIndex + 2]})`
          : settings.foreground;
        context.fillText(line[x], settings.padding + x * cellWidth, top);
      }
    }
  }, [result, settings]);

  const resetSettings = () => {
    settingsRef.current = DEFAULT_SETTINGS;
    setSettings(DEFAULT_SETTINGS);
    setZoom(100);
    setWrap(false);
  };

  const applyPreset = (name) => {
    const preset = [...customPresets, ...PRESETS].find((entry) => entry.name === name);
    if (!preset) return;
    const mode = preset.settings.mode || DEFAULT_SETTINGS.mode;
    updateSettings({
      ...DEFAULT_SETTINGS,
      ...preset.settings,
      ...(preset.settings.characters === undefined && RAMPS[mode] ? { characters: RAMPS[mode] } : {}),
    });
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) {
      setError('Nhập tên preset trước khi lưu.');
      return;
    }
    if (PRESETS.some((preset) => preset.name.toLowerCase() === name.toLowerCase())) {
      setError('Tên này đã được dùng cho preset mặc định.');
      return;
    }
    const nextPresets = [...customPresets.filter((preset) => preset.name !== name), { name, settings }];
    try {
      localStorage.setItem('windhub-image-art-presets', JSON.stringify(nextPresets));
      setCustomPresets(nextPresets);
      setPresetName('');
      setError('');
      toast.success(`Đã lưu preset "${name}".`);
    } catch {
      setError('Không thể lưu preset vào bộ nhớ trình duyệt.');
    }
  };

  const deletePreset = (name) => {
    const nextPresets = customPresets.filter((preset) => preset.name !== name);
    try {
      localStorage.setItem('windhub-image-art-presets', JSON.stringify(nextPresets));
      setCustomPresets(nextPresets);
    } catch {
      setError('Không thể cập nhật preset trong bộ nhớ trình duyệt.');
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await copyText(result.text);
      toast.success('Đã sao chép ASCII vào clipboard.');
    } catch {
      setError('Không thể sao chép. Hãy kiểm tra quyền clipboard của trình duyệt.');
    }
  };

  const handleDownloadText = () => {
    if (result) saveBlob(new Blob([result.text], { type: 'text/plain;charset=utf-8' }), 'windhub-ascii-art.txt');
  };

  const handleDownloadJson = () => {
    saveBlob(new Blob([JSON.stringify({ name: 'WindHub Image Art Preset', version: 1, settings }, null, 2)], { type: 'application/json' }), 'windhub-image-art-preset.json');
  };

  const makeHtml = () => {
    if (!result) return '';
    const rows = result.text.split('\n');
    const colored = settings.mode === 'color';
    const content = rows.map((line, y) => {
      if (!colored) return escapeHtml(line);
      return Array.from(line).map((character, x) => {
        const index = (y * result.columns + x) * 3;
        const color = `rgb(${result.colors[index]},${result.colors[index + 1]},${result.colors[index + 2]})`;
        return `<span style="color:${color}">${escapeHtml(character)}</span>`;
      }).join('');
    }).join('\n');
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>WindHub Text Art</title><style>body{margin:0;padding:${settings.padding}px;background:${settings.background};color:${settings.foreground};font:${settings.fontSize}px/${settings.lineHeight} ${settings.fontFamily};overflow:auto}pre{white-space:pre;letter-spacing:${settings.characterSpacing}px}</style></head><body><pre>${content}</pre></body></html>`;
  };

  const handleDownloadHtml = () => {
    saveBlob(new Blob([makeHtml()], { type: 'text/html;charset=utf-8' }), 'windhub-image-art.html');
  };

  const handleDownloadSvg = () => {
    if (!result) return;
    const cellWidth = Math.max(1, settings.fontSize * 0.6 + Number(settings.characterSpacing || 0));
    const width = Math.ceil(settings.padding * 2 + result.columns * cellWidth);
    const height = Math.ceil(settings.padding * 2 + result.rows * settings.fontSize * settings.lineHeight);
    const lines = result.text.split('\n').map((line, y) => {
      const body = settings.mode === 'color'
        ? Array.from(line).map((character, x) => {
          const index = (y * result.columns + x) * 3;
          const color = `rgb(${result.colors[index]},${result.colors[index + 1]},${result.colors[index + 2]})`;
          return `<tspan fill="${color}">${escapeHtml(character)}</tspan>`;
        }).join('')
        : escapeHtml(line);
      return `<text x="${settings.padding}" y="${settings.padding + settings.fontSize + y * settings.fontSize * settings.lineHeight}">${body}</text>`;
    }).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${settings.background}"/><g fill="${settings.foreground}" font-family="${escapeHtml(settings.fontFamily)}" font-size="${settings.fontSize}" letter-spacing="${settings.characterSpacing}">${lines}</g></svg>`;
    saveBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'windhub-ascii-art.svg');
  };

  const handleDownloadPng = () => {
    const canvas = resultCanvasRef.current;
    if (!canvas || !result) return;
    canvas.toBlob((blob) => {
      if (blob) saveBlob(blob, 'windhub-ascii-art.png');
      else setError('Không thể xuất PNG. Hãy thử giảm cỡ chữ hoặc chiều rộng.');
    }, 'image/png');
  };

  const copyHtml = async () => {
    try {
      await copyText(makeHtml());
      toast.success('Đã sao chép HTML.');
    } catch {
      setError('Không thể sao chép HTML vào clipboard.');
    }
  };

  const updateNumber = (key, value) => updateSettings({ [key]: Number(value) });
  const isColored = settings.mode === 'color';

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-100">
        <header className="flex items-center gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-500"><Sparkles size={22} /></div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-500">windhub // image to text art</p>
              <p className="text-sm text-slate-500">Ảnh được xử lý hoàn toàn trên thiết bị; không tải lên máy chủ.</p>
            </div>
          </div>
        </header>

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#101010]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold">Original</h3>
                  <p className="text-xs text-slate-500">{source ? `${source.file.name} · ${source.width} × ${source.height} · ${(source.file.size / 1024 / 1024).toFixed(2)} MB` : 'Chọn, kéo thả hoặc dán ảnh'}</p>
                </div>
                {source && <button type="button" className={BUTTON_CLASS} onClick={removeImage}><X size={14} /> Gỡ ảnh</button>}
              </div>
              <div
                onDragOver={(event) => { event.preventDefault(); setDropActive(true); }}
                onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDropActive(false); }}
                onDrop={(event) => { event.preventDefault(); setDropActive(false); void selectFile(event.dataTransfer.files[0]); }}
                onPaste={handlePaste}
                tabIndex={0}
                aria-label="Vùng chọn ảnh. Kéo thả hoặc dán ảnh bằng Ctrl+V."
                className={`relative flex min-h-52 items-center justify-center overflow-hidden rounded-lg border border-dashed outline-none transition focus-visible:ring-2 focus-visible:ring-orange-500 ${dropActive ? 'border-orange-500 bg-orange-500/10' : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-black'}`}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt={`Ảnh gốc ${source.file.name}`} className="max-h-72 w-full object-contain" />
                ) : (
                  <div className="p-5 text-center">
                    <Image className="mx-auto mb-3 text-slate-400" size={34} />
                    <p className="text-sm font-semibold">Thả ảnh vào đây hoặc nhấn chọn ảnh</p>
                    <p className="mt-1 text-xs text-slate-500">PNG · JPG · WEBP · GIF · BMP — tối đa 20 MB</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <button type="button" onClick={() => uploadRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-600"><Upload size={14} /> Chọn ảnh</button>
                      <button type="button" onClick={() => void loadSample()} className={BUTTON_CLASS}><Sparkles size={14} /> Ảnh mẫu</button>
                    </div>
                  </div>
                )}
              </div>
              {source && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => uploadRef.current?.click()} className={BUTTON_CLASS}><Upload size={14} /> Thay ảnh</button>
                  <span className="text-[11px] text-slate-500">Ctrl+V để dán ảnh từ clipboard</span>
                </div>
              )}
              <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" className="sr-only" onChange={(event) => void selectFile(event.target.files?.[0])} />
            </section>

            <section ref={previewPanelRef} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#101010]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div><h3 className="text-sm font-bold">Result</h3><p className="text-xs text-slate-500">{processing ? 'Đang cập nhật bản xem trước…' : result ? `${result.columns} columns · ${result.rows} rows · ${(result.columns * result.rows).toLocaleString()} characters` : 'ASCII preview'}</p></div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setZoom((current) => Math.max(50, current - 25))} disabled={!result} aria-label="Thu nhỏ bản xem trước" className="rounded-md p-2 text-slate-500 hover:bg-slate-200 disabled:opacity-40 dark:hover:bg-slate-800"><ZoomOut size={16} /></button>
                  <button type="button" onClick={() => setZoom(100)} disabled={!result} className="min-w-12 rounded-md px-1 py-2 text-[11px] font-mono text-slate-500 hover:bg-slate-200 disabled:opacity-40 dark:hover:bg-slate-800">{zoom}%</button>
                  <button type="button" onClick={() => setZoom((current) => Math.min(200, current + 25))} disabled={!result} aria-label="Phóng to bản xem trước" className="rounded-md p-2 text-slate-500 hover:bg-slate-200 disabled:opacity-40 dark:hover:bg-slate-800"><ZoomIn size={16} /></button>
                  <button type="button" onClick={() => previewPanelRef.current?.requestFullscreen?.()} disabled={!result} aria-label="Toàn màn hình" className="rounded-md p-2 text-slate-500 hover:bg-slate-200 disabled:opacity-40 dark:hover:bg-slate-800"><Maximize2 size={15} /></button>
                </div>
              </div>
              <div className="max-h-[45vh] min-h-52 overflow-auto rounded-lg border border-slate-200 bg-black p-2 dark:border-slate-800 sm:max-h-[440px]">
                {result ? (
                  <>
                    <canvas ref={resultCanvasRef} role="img" aria-label="Bản xem trước kết quả ASCII" className="block h-auto max-w-none" style={{ width: `${zoom}%` }} />
                    <pre className="sr-only" aria-label="Nội dung văn bản ASCII">{result.text}</pre>
                  </>
                ) : (
                  <div className="flex h-52 items-center justify-center text-center text-xs text-slate-500">
                    {processing ? <span className="inline-flex items-center gap-2"><LoaderCircle className="animate-spin" size={16} /> Đang xử lý trong trình duyệt…</span> : 'Kết quả sẽ xuất hiện tại đây.'}
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={wrap} onChange={(event) => setWrap(event.target.checked)} className="accent-orange-500" /> Cho phép wrap trong preview</label>
                {processing && <button type="button" onClick={cancelRender} className="text-xs font-semibold text-red-500">Hủy xử lý</button>}
              </div>
              {wrap && result && <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black p-2 font-mono text-[10px] text-slate-300">{result.text}</pre>}
            </section>
          </div>

          {error && <div role="alert" className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Đóng thông báo" className="shrink-0"><X size={16} /></button></div>}

          <section className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:p-4">
            <div className="mb-3 flex items-center gap-2"><SlidersHorizontal size={17} className="text-orange-500" /><h3 className="text-sm font-bold">Controls</h3></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Mode
                <select className={CONTROL_CLASS} value={settings.mode} onChange={(event) => {
                  const mode = event.target.value;
                  updateSettings({ mode, ...(RAMPS[mode] ? { characters: RAMPS[mode] } : {}) });
                }}>{MODE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Width · {settings.columns} columns
                <input aria-label="Độ rộng ASCII" type="range" min="20" max="240" value={settings.columns} onChange={(event) => updateNumber('columns', event.target.value)} className={RANGE_CLASS} />
              </label>
              <div className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.autoHeight} onChange={(event) => updateSettings({ autoHeight: event.target.checked })} className="accent-orange-500" /> Auto height / aspect ratio</label>
                {!settings.autoHeight && <label className="block">Height · {settings.rows} rows<input aria-label="Chiều cao ASCII" type="range" min="10" max="240" value={settings.rows} onChange={(event) => updateNumber('rows', event.target.value)} className={RANGE_CLASS} /></label>}
              </div>
              {['classic', 'dense', 'unicode', 'edge', 'dither', 'custom'].includes(settings.mode) && (
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Character set
                  <input className={CONTROL_CLASS} value={settings.characters} maxLength={80} onChange={(event) => updateSettings({ characters: event.target.value })} aria-label="Bộ ký tự chuyển sắc" />
                </label>
              )}
              <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Crop ratio
                <select className={CONTROL_CLASS} value={settings.cropAspect} onChange={(event) => updateSettings({ cropAspect: event.target.value })}>
                  {['original', 'free', '1:1', '4:3', '16:9', '9:16'].map((ratio) => <option key={ratio} value={ratio}>{ratio === 'original' ? 'Original' : ratio === 'free' ? 'Free crop' : ratio}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Fit
                <select className={CONTROL_CLASS} value={settings.fitMode} onChange={(event) => updateSettings({ fitMode: event.target.value })}><option value="cover">Crop to fill</option><option value="contain">Fit entire image</option></select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Character aspect · {settings.characterAspect.toFixed(2)}
                <select className={CONTROL_CLASS} value={settings.characterAspectPreset} onChange={(event) => {
                  const aspect = { terminal: 0.52, monospace: 0.6, browser: 0.62, square: 1, custom: settings.characterAspect }[event.target.value];
                  updateSettings({ characterAspectPreset: event.target.value, characterAspect: aspect });
                }}>
                  <option value="terminal">Terminal</option><option value="monospace">Monospace</option><option value="browser">Browser</option><option value="square">Square</option><option value="custom">Custom</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Cell aspect
                <input type="range" min="0.35" max="1" step="0.01" value={settings.characterAspect} disabled={settings.characterAspectPreset !== 'custom'} onChange={(event) => updateNumber('characterAspect', event.target.value)} className={RANGE_CLASS} />
              </label>
              {settings.mode === 'block' && <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Block style<select className={CONTROL_CLASS} value={settings.blockStyle} onChange={(event) => updateSettings({ blockStyle: event.target.value })}><option value="shade">Shade blocks</option><option value="half">Half blocks</option></select></label>}
              {settings.mode === 'dither' && <>
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Dither algorithm<select className={CONTROL_CLASS} value={settings.ditherAlgorithm} onChange={(event) => updateSettings({ ditherAlgorithm: event.target.value })}><option value="floyd-steinberg">Floyd–Steinberg</option><option value="ordered">Ordered Bayer</option><option value="atkinson">Atkinson</option></select></label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Dither strength · {settings.ditherStrength}%<input type="range" min="0" max="100" value={settings.ditherStrength} onChange={(event) => updateNumber('ditherStrength', event.target.value)} className={RANGE_CLASS} /></label>
              </>}
              {settings.mode === 'edge' && <>
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Edge threshold<input type="range" min="0" max="100" value={settings.edgeThreshold} onChange={(event) => updateNumber('edgeThreshold', event.target.value)} className={RANGE_CLASS} /></label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Edge strength<input type="range" min="0.2" max="4" step="0.1" value={settings.edgeStrength} onChange={(event) => updateNumber('edgeStrength', event.target.value)} className={RANGE_CLASS} /></label>
              </>}
              {settings.mode === 'braille' && <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Braille threshold<input type="range" min="0" max="255" value={settings.brailleThreshold} onChange={(event) => updateNumber('brailleThreshold', event.target.value)} className={RANGE_CLASS} /></label>}
              {settings.mode === 'block' && <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Block threshold<input type="range" min="0" max="255" value={settings.blockThreshold} onChange={(event) => updateNumber('blockThreshold', event.target.value)} className={RANGE_CLASS} /></label>}
            </div>

            <details className="mt-4 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold"><Settings2 size={16} className="text-orange-500" /> Advanced settings</summary>
              <div className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['brightness', 'Brightness', -100, 100, 1],
                  ['contrast', 'Contrast', -100, 100, 1],
                  ['gamma', 'Gamma', 0.4, 2.4, 0.05],
                  ['exposure', 'Exposure', -2, 2, 0.1],
                  ['saturation', 'Saturation', 0, 200, 1],
                  ['blur', 'Smoothing', 0, 100, 1],
                  ['sharpness', 'Sharpness', 0, 100, 1],
                ].map(([key, label, min, max, step]) => (
                  <label key={key} className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">{label} · {settings[key]}
                    <input type="range" min={min} max={max} step={step} value={settings[key]} onChange={(event) => updateNumber(key, event.target.value)} className={RANGE_CLASS} />
                  </label>
                ))}
                <label className="flex items-center gap-2 self-end pb-1 text-xs font-semibold text-slate-600 dark:text-slate-400"><input type="checkbox" checked={settings.invert} onChange={(event) => updateSettings({ invert: event.target.checked })} className="accent-orange-500" /> Invert</label>
                <label className="flex items-center gap-2 self-end pb-1 text-xs font-semibold text-slate-600 dark:text-slate-400"><input type="checkbox" checked={settings.thresholdEnabled} onChange={(event) => updateSettings({ thresholdEnabled: event.target.checked })} className="accent-orange-500" /> Apply threshold</label>
                {settings.thresholdEnabled && <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Threshold · {settings.threshold}<input type="range" min="0" max="255" value={settings.threshold} onChange={(event) => updateNumber('threshold', event.target.value)} className={RANGE_CLASS} /></label>}
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Zoom crop · {settings.zoom.toFixed(1)}×<input type="range" min="1" max="3" step="0.1" value={settings.zoom} onChange={(event) => updateNumber('zoom', event.target.value)} className={RANGE_CLASS} /></label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Pan horizontal<input type="range" min="0" max="100" value={settings.panX} onChange={(event) => updateNumber('panX', event.target.value)} className={RANGE_CLASS} /></label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Pan vertical<input type="range" min="0" max="100" value={settings.panY} onChange={(event) => updateNumber('panY', event.target.value)} className={RANGE_CLASS} /></label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Foreground<input type="color" value={settings.foreground} onChange={(event) => updateSettings({ foreground: event.target.value })} className="h-10 w-full rounded-lg border border-slate-300 bg-transparent p-1 dark:border-slate-700" /></label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Background<input type="color" value={settings.background} onChange={(event) => updateSettings({ background: event.target.value })} className="h-10 w-full rounded-lg border border-slate-300 bg-transparent p-1 dark:border-slate-700" /></label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Font size · {settings.fontSize}px<input type="range" min="6" max="18" value={settings.fontSize} onChange={(event) => updateNumber('fontSize', event.target.value)} className={RANGE_CLASS} /></label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Line height · {settings.lineHeight.toFixed(2)}<input type="range" min="0.8" max="1.5" step="0.05" value={settings.lineHeight} onChange={(event) => updateNumber('lineHeight', event.target.value)} className={RANGE_CLASS} /></label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Character spacing · {settings.characterSpacing}px<input type="range" min="-1" max="5" step="0.25" value={settings.characterSpacing} onChange={(event) => updateNumber('characterSpacing', event.target.value)} className={RANGE_CLASS} /></label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Padding · {settings.padding}px<input type="range" min="0" max="80" step="2" value={settings.padding} onChange={(event) => updateNumber('padding', event.target.value)} className={RANGE_CLASS} /></label>
                <div className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <label>Font stack
                    <select className={CONTROL_CLASS} value={selectedFontPreset} onChange={(event) => { if (event.target.value !== 'custom') updateSettings({ fontFamily: event.target.value }); }}><option value={FONT_STACKS[0]}>System monospace</option><option value={FONT_STACKS[1]}>JetBrains Mono</option><option value={FONT_STACKS[2]}>Monospace</option><option value="custom">Custom stack</option></select>
                  </label>
                  {selectedFontPreset === 'custom' && <input aria-label="Custom font stack" value={settings.fontFamily} onChange={(event) => updateSettings({ fontFamily: event.target.value })} className={CONTROL_CLASS} placeholder="ui-monospace, monospace" />}
                </div>
              </div>
            </details>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="mb-3 flex items-center gap-2"><Palette size={16} className="text-orange-500" /><h3 className="text-sm font-bold">Presets</h3></div>
              <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Chọn preset" className={`${CONTROL_CLASS} max-w-56`} defaultValue="" onChange={(event) => applyPreset(event.target.value)}><option value="" disabled>Chọn preset…</option>{PRESETS.map((preset) => <option key={preset.name}>{preset.name}</option>)}{customPresets.map((preset) => <option key={preset.name}>{preset.name}</option>)}</select>
                <input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Tên preset mới" className={`${CONTROL_CLASS} max-w-48`} />
                <button type="button" onClick={savePreset} className={BUTTON_CLASS}><Save size={14} /> Lưu</button>
                {customPresets.map((preset) => <span key={preset.name} className="inline-flex items-center rounded-lg border border-slate-300 text-xs dark:border-slate-700"><span className="px-2 text-slate-600 dark:text-slate-300">{preset.name}</span><button type="button" onClick={() => deletePreset(preset.name)} title={`Xóa preset ${preset.name}`} aria-label={`Xóa preset ${preset.name}`} className="border-l border-slate-300 p-2 text-slate-500 hover:text-red-500 dark:border-slate-700"><Trash2 size={14} /></button></span>)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <button type="button" onClick={() => void handleCopy()} disabled={!result} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"><Copy size={14} /> Copy text</button>
              <button type="button" onClick={handleDownloadText} disabled={!result} className={BUTTON_CLASS}><FileText size={14} /> TXT</button>
              <button type="button" onClick={handleDownloadPng} disabled={!result} className={BUTTON_CLASS}><FileImage size={14} /> PNG</button>
              <button type="button" onClick={handleDownloadSvg} disabled={!result} className={BUTTON_CLASS}><Image size={14} /> SVG</button>
              <button type="button" onClick={handleDownloadHtml} disabled={!result} className={BUTTON_CLASS}><Code2 size={14} /> HTML</button>
              {isColored && <button type="button" onClick={() => void copyHtml()} disabled={!result} className={BUTTON_CLASS}><Copy size={14} /> Copy HTML</button>}
              <button type="button" onClick={handleDownloadJson} className={BUTTON_CLASS}><Download size={14} /> JSON preset</button>
              <button type="button" onClick={resetSettings} className={BUTTON_CLASS}><RotateCcw size={14} /> Reset</button>
            </div>
          </section>
        </div>
    </div>
  );
}

export default ImageArtStudio;
