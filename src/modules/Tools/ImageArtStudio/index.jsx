import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Code2,
  Columns2,
  Copy,
  Download,
  Eye,
  FileImage,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Maximize2,
  Palette,
  RotateCcw,
  Save,
  SlidersHorizontal,
  SunMedium,
  Trash2,
  Type,
  Upload,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/os/Button';
import {
  StudioSegmentedBar,
  StudioWorkspaceHeader,
} from '@/components/studio/StudioPrimitives';
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
  {
    name: 'Retro Terminal',
    settings: { mode: 'custom', characters: 'WIND 01', foreground: '#7cff82', background: '#071009' },
  },
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
  ['braille', 'Braille (2×4)'],
  ['block', 'Block Shading'],
  ['edge', 'Sobel Edge'],
  ['dither', 'Dithered'],
  ['color', 'Colored RGB'],
  ['custom', 'Custom Glyph'],
];

const INSPECTOR_TABS = [
  { id: 'mode', label: 'Chế độ', icon: SlidersHorizontal },
  { id: 'tone', label: 'Ánh sáng', icon: SunMedium },
  { id: 'style', label: 'Kiểu chữ', icon: Type },
];

const STAGE_VIEWS = [
  { id: 'split', label: 'Song song', icon: Columns2 },
  { id: 'result', label: 'Kết quả ASCII', icon: Eye },
  { id: 'source', label: 'Ảnh gốc', icon: ImageIcon },
];

const RANGE_CLASS = 'w-full accent-[var(--os-accent)] cursor-pointer';
const CONTROL_CLASS =
  'os-focus-ring w-full rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3 py-2 text-xs font-medium text-[var(--os-text-primary)] outline-none transition-colors focus:border-[var(--os-accent)]';
const EXPORT_BTN_CLASS =
  'os-focus-ring inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--os-text-secondary)] transition-colors hover:border-[var(--os-accent-border)] hover:text-[var(--os-text-primary)] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer';

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
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error('Không thể tạo ảnh mẫu.'))),
      'image/png'
    );
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

export default function ImageArtStudio() {
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
  const [inspectorTab, setInspectorTab] = useState('mode');
  const [stageView, setStageView] = useState('split');
  const [activePresetName, setActivePresetName] = useState('Classic');
  const [presetName, setPresetName] = useState('');
  const [customPresets, setCustomPresets] = useState(() => {
    try {
      const value = JSON.parse(localStorage.getItem('windhub-image-art-presets') || '[]');
      return Array.isArray(value)
        ? value.filter((entry) => typeof entry.name === 'string' && entry.settings)
        : [];
    } catch {
      return [];
    }
  });

  const selectedFontPreset = FONT_STACKS.includes(settings.fontFamily)
    ? settings.fontFamily
    : 'custom';
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
      setError(
        imageError.message?.includes('quá lớn')
          ? imageError.message
          : 'Không đọc được ảnh này. Hãy thử file PNG, JPG, WEBP, GIF hoặc BMP khác.'
      );
    }
  }, []);

  const handlePaste = useCallback(
    (event) => {
      const imageItem = Array.from(event.clipboardData?.items || []).find((item) =>
        item.type.startsWith('image/')
      );
      const file = imageItem?.getAsFile();
      if (!file) return;
      event.preventDefault();
      void selectFile(file);
    },
    [selectFile]
  );

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
          ? Math.max(1, Math.round((columns / targetRatio) * currentSettings.characterAspect))
          : Math.min(240, Math.max(1, Number(currentSettings.rows) || 80));
        if (columns * rows > MAX_OUTPUT_CELLS)
          rows = Math.max(1, Math.floor(MAX_OUTPUT_CELLS / columns));
        rows = Math.min(240, rows);
        const scaleX = currentSettings.mode === 'braille' ? 2 : 1;
        const scaleY =
          currentSettings.mode === 'braille'
            ? 4
            : currentSettings.mode === 'block' && currentSettings.blockStyle === 'half'
            ? 2
            : 1;
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
            currentSettings.fitMode
          );
          if (crop.contain) {
            const factor = Math.min(pixelWidth / bitmap.width, pixelHeight / bitmap.height);
            const drawWidth = bitmap.width * factor;
            const drawHeight = bitmap.height * factor;
            context.drawImage(
              bitmap,
              (pixelWidth - drawWidth) / 2,
              (pixelHeight - drawHeight) / 2,
              drawWidth,
              drawHeight
            );
          } else {
            context.drawImage(
              bitmap,
              crop.x,
              crop.y,
              crop.width,
              crop.height,
              0,
              0,
              pixelWidth,
              pixelHeight
            );
          }
        } finally {
          bitmap.close();
        }
        const imageData = context.getImageData(0, 0, pixelWidth, pixelHeight);
        const renderSettings = { ...currentSettings, columns, rows };
        const worker = new Worker(new URL('./render.worker.js', import.meta.url), {
          type: 'module',
        });
        workerRef.current?.terminate();
        workerRef.current = worker;
        worker.onmessage = (event) => {
          if (
            event.data.requestId !== currentRequestId ||
            currentRequestId !== requestIdRef.current
          )
            return;
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
            toast.warning(
              'Trình duyệt không chạy được Worker; ảnh đã được xử lý trực tiếp trên luồng chính.'
            );
          } catch (fallbackError) {
            setError(
              `Không thể xử lý ảnh: ${
                fallbackError.message || workerError.message || 'Worker bị lỗi.'
              }`
            );
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
    const cellWidth =
      Math.max(settings.fontSize * 0.6, context.measureText('M').width) +
      Number(settings.characterSpacing || 0);
    const width = Math.ceil(settings.padding * 2 + result.columns * cellWidth);
    const height = Math.ceil(
      settings.padding * 2 + result.rows * settings.fontSize * settings.lineHeight
    );
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
          ? `rgb(${result.colors[colorIndex]} ${result.colors[colorIndex + 1]} ${
              result.colors[colorIndex + 2]
            })`
          : settings.foreground;
        context.fillText(line[x], settings.padding + x * cellWidth, top);
      }
    }
  }, [result, settings, stageView]);

  const resetSettings = () => {
    settingsRef.current = DEFAULT_SETTINGS;
    setSettings(DEFAULT_SETTINGS);
    setActivePresetName('Classic');
    setZoom(100);
    setWrap(false);
  };

  const applyPreset = (name) => {
    const preset = [...customPresets, ...PRESETS].find((entry) => entry.name === name);
    if (!preset) return;
    setActivePresetName(name);
    const mode = preset.settings.mode || DEFAULT_SETTINGS.mode;
    updateSettings({
      ...DEFAULT_SETTINGS,
      ...preset.settings,
      ...(preset.settings.characters === undefined && RAMPS[mode]
        ? { characters: RAMPS[mode] }
        : {}),
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
    const nextPresets = [
      ...customPresets.filter((preset) => preset.name !== name),
      { name, settings },
    ];
    try {
      localStorage.setItem('windhub-image-art-presets', JSON.stringify(nextPresets));
      setCustomPresets(nextPresets);
      setActivePresetName(name);
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
      if (activePresetName === name) setActivePresetName('');
    } catch {
      setError('Không thể cập nhật preset trong bộ nhớ trình duyệt.');
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await copyText(result.text);
      toast.success('Đã sao chép văn bản ASCII vào clipboard.');
    } catch {
      setError('Không thể sao chép. Hãy kiểm tra quyền clipboard của trình duyệt.');
    }
  };

  const handleDownloadPng = () => {
    const canvas = resultCanvasRef.current;
    if (!canvas || !result) return;
    canvas.toBlob((blob) => {
      if (blob) saveBlob(blob, 'windhub-ascii-art.png');
      else setError('Không thể xuất PNG. Hãy thử giảm cỡ chữ hoặc chiều rộng.');
    }, 'image/png');
  };

  const handleCopyImage = async () => {
    const canvas = resultCanvasRef.current;
    if (!canvas || !result) return;
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error('Trình duyệt không hỗ trợ sao chép ảnh trực tiếp.');
      }
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error('Không thể tạo ảnh PNG.'))),
          'image/png'
        );
      });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast.success('Đã sao chép ảnh ASCII (giữ nguyên căn lề khi dán).');
    } catch (copyError) {
      if (copyError.message === 'Trình duyệt không hỗ trợ sao chép ảnh trực tiếp.') {
        handleDownloadPng();
        toast.warning(
          'Trình duyệt không hỗ trợ copy ảnh trực tiếp; đã tải tệp PNG thay thế.'
        );
        return;
      }
      setError('Không thể sao chép ảnh vào clipboard. Hãy thử tải PNG thay thế.');
    }
  };

  const handleDownloadText = () => {
    if (result)
      saveBlob(
        new Blob([result.text], { type: 'text/plain;charset=utf-8' }),
        'windhub-ascii-art.txt'
      );
  };

  const handleDownloadJson = () => {
    saveBlob(
      new Blob(
        [JSON.stringify({ name: 'WindHub Image Art Preset', version: 1, settings }, null, 2)],
        { type: 'application/json' }
      ),
      'windhub-image-art-preset.json'
    );
  };

  const makeHtml = () => {
    if (!result) return '';
    const rows = result.text.split('\n');
    const colored = settings.mode === 'color';
    const content = rows
      .map((line, y) => {
        if (!colored) return escapeHtml(line);
        return Array.from(line)
          .map((character, x) => {
            const index = (y * result.columns + x) * 3;
            const color = `rgb(${result.colors[index]},${result.colors[index + 1]},${
              result.colors[index + 2]
            })`;
            return `<span style="color:${color}">${escapeHtml(character)}</span>`;
          })
          .join('');
      })
      .join('\n');
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>WindHub Text Art</title><style>body{margin:0;padding:${settings.padding}px;background:${settings.background};color:${settings.foreground};font:${settings.fontSize}px/${settings.lineHeight} ${settings.fontFamily};overflow:auto}pre{white-space:pre;letter-spacing:${settings.characterSpacing}px}</style></head><body><pre>${content}</pre></body></html>`;
  };

  const handleDownloadHtml = () => {
    saveBlob(
      new Blob([makeHtml()], { type: 'text/html;charset=utf-8' }),
      'windhub-image-art.html'
    );
  };

  const handleDownloadSvg = () => {
    if (!result) return;
    const cellWidth = Math.max(1, settings.fontSize * 0.6 + Number(settings.characterSpacing || 0));
    const width = Math.ceil(settings.padding * 2 + result.columns * cellWidth);
    const height = Math.ceil(
      settings.padding * 2 + result.rows * settings.fontSize * settings.lineHeight
    );
    const lines = result.text
      .split('\n')
      .map((line, y) => {
        const body =
          settings.mode === 'color'
            ? Array.from(line)
                .map((character, x) => {
                  const index = (y * result.columns + x) * 3;
                  const color = `rgb(${result.colors[index]},${result.colors[index + 1]},${
                    result.colors[index + 2]
                  })`;
                  return `<tspan fill="${color}">${escapeHtml(character)}</tspan>`;
                })
                .join('')
            : escapeHtml(line);
        return `<text x="${settings.padding}" y="${
          settings.padding + settings.fontSize + y * settings.fontSize * settings.lineHeight
        }">${body}</text>`;
      })
      .join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${settings.background}"/><g fill="${settings.foreground}" font-family="${escapeHtml(
      settings.fontFamily
    )}" font-size="${settings.fontSize}" letter-spacing="${
      settings.characterSpacing
    }">${lines}</g></svg>`;
    saveBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'windhub-ascii-art.svg');
  };

  const copyHtml = async () => {
    try {
      await copyText(makeHtml());
      toast.success('Đã sao chép mã HTML.');
    } catch {
      setError('Không thể sao chép HTML vào clipboard.');
    }
  };

  const updateNumber = (key, value) => updateSettings({ [key]: Number(value) });
  const isColored = settings.mode === 'color';

  return (
    <div className="flex flex-col gap-4 pb-6 text-[var(--os-text-primary)]">
      {/* 1. COMMERCIAL STUDIO HEADER */}
      <StudioWorkspaceHeader
        eyebrow="OPTICAL GLYPH ENGINE"
        title="Image → ASCII Studio"
        description="Xử lý ảnh 100% cục bộ qua Web Worker: tùy chỉnh 9 thuật toán ký tự, tinh chỉnh tương phản quang học và xuất đa định dạng."
        emblemVariant="ascii"
        tone="orange"
        badges={['Web Worker', 'Max 20 MB']}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Wand2 size={14} />}
              onClick={() => void loadSample()}
            >
              Ảnh mẫu
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Upload size={14} />}
              onClick={() => uploadRef.current?.click()}
            >
              {source ? 'Thay ảnh' : 'Chọn ảnh'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={resetSettings}
            >
              Đặt lại
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!result}
              icon={<ImageIcon size={14} />}
              onClick={() => void handleCopyImage()}
            >
              Copy Ảnh
            </Button>
          </>
        }
      />

      <input
        ref={uploadRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
        className="sr-only"
        onChange={(event) => void selectFile(event.target.files?.[0])}
      />

      {/* 2. QUICK PRESET RIBBON */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar rounded-[var(--radius-md)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-1)] px-3 py-2">
        <span className="inline-flex shrink-0 items-center gap-1.5 pr-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
          <Palette size={13} className="text-[var(--os-accent)]" />
          <span>Preset:</span>
        </span>
        {PRESETS.map((preset) => {
          const isCurrent = activePresetName === preset.name;
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset.name)}
              className={`os-focus-ring shrink-0 rounded-[var(--radius-xs)] border px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                isCurrent
                  ? 'border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)] font-bold'
                  : 'border-transparent bg-[var(--os-surface-2)] text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)]'
              }`}
            >
              {preset.name}
            </button>
          );
        })}
        {customPresets.map((preset) => {
          const isCurrent = activePresetName === preset.name;
          return (
            <span
              key={preset.name}
              className={`inline-flex shrink-0 items-center rounded-[var(--radius-xs)] border text-xs ${
                isCurrent
                  ? 'border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]'
                  : 'border-[var(--os-border-default)] bg-[var(--os-surface-2)] text-[var(--os-text-secondary)]'
              }`}
            >
              <button
                type="button"
                onClick={() => applyPreset(preset.name)}
                className="px-2.5 py-1 font-semibold cursor-pointer"
              >
                {preset.name}
              </button>
              <button
                type="button"
                onClick={() => deletePreset(preset.name)}
                aria-label={`Xóa preset ${preset.name}`}
                className="border-l border-[var(--os-border-subtle)] px-1.5 py-1 text-[var(--os-text-muted)] hover:text-[var(--os-danger)] cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </span>
          );
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--os-danger-border)] bg-[var(--os-danger-soft)] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[var(--os-danger)]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Đóng thông báo"
            className="shrink-0 rounded p-0.5 hover:bg-black/10 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 3. MAIN DESKTOP STUDIO WORKSPACE: LEFT INSPECTOR + RIGHT CANVAS STAGE */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
        {/* LEFT INSPECTOR SIDEBAR */}
        <aside className="rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-3.5 space-y-4">
          <StudioSegmentedBar
            items={INSPECTOR_TABS}
            activeId={inspectorTab}
            onSelect={setInspectorTab}
            layoutId="ascii-inspector-tab"
            ariaLabel="Nhóm điều chỉnh thông số"
            size="sm"
            className="w-full justify-between"
          />

          {/* TAB 1: MODE & GEOMETRY */}
          {inspectorTab === 'mode' && (
            <div className="space-y-3.5 text-xs">
              <label className="block space-y-1.5 font-semibold text-[var(--os-text-secondary)]">
                <span>Thuật toán hiển thị</span>
                <select
                  className={CONTROL_CLASS}
                  value={settings.mode}
                  onChange={(event) => {
                    const mode = event.target.value;
                    setActivePresetName('');
                    updateSettings({ mode, ...(RAMPS[mode] ? { characters: RAMPS[mode] } : {}) });
                  }}
                >
                  {MODE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1 font-semibold text-[var(--os-text-secondary)]">
                <div className="flex justify-between">
                  <span>Độ rộng lưới</span>
                  <span className="font-mono text-[var(--os-accent)]">{settings.columns} cột</span>
                </div>
                <input
                  aria-label="Độ rộng ASCII"
                  type="range"
                  min="20"
                  max="240"
                  value={settings.columns}
                  onChange={(e) => updateNumber('columns', e.target.value)}
                  className={RANGE_CLASS}
                />
              </label>

              <div className="space-y-2 rounded-[var(--radius-sm)] bg-[var(--os-surface-2)] p-2.5">
                <label className="flex items-center justify-between gap-2 font-semibold text-[var(--os-text-secondary)] cursor-pointer">
                  <span>Tự động chiều cao theo tỷ lệ</span>
                  <input
                    type="checkbox"
                    checked={settings.autoHeight}
                    onChange={(e) => updateSettings({ autoHeight: e.target.checked })}
                    className="accent-[var(--os-accent)] size-4"
                  />
                </label>
                {!settings.autoHeight && (
                  <label className="block space-y-1 pt-1 font-semibold text-[var(--os-text-secondary)]">
                    <div className="flex justify-between">
                      <span>Chiều cao</span>
                      <span className="font-mono">{settings.rows} dòng</span>
                    </div>
                    <input
                      aria-label="Chiều cao ASCII"
                      type="range"
                      min="10"
                      max="240"
                      value={settings.rows}
                      onChange={(e) => updateNumber('rows', e.target.value)}
                      className={RANGE_CLASS}
                    />
                  </label>
                )}
              </div>

              {['classic', 'dense', 'unicode', 'edge', 'dither', 'custom'].includes(
                settings.mode
              ) && (
                <label className="block space-y-1.5 font-semibold text-[var(--os-text-secondary)]">
                  <span>Chuỗi ký tự chuyển sắc</span>
                  <input
                    className={`${CONTROL_CLASS} font-mono`}
                    value={settings.characters}
                    maxLength={80}
                    onChange={(e) => updateSettings({ characters: e.target.value })}
                    aria-label="Bộ ký tự chuyển sắc"
                  />
                </label>
              )}

              {settings.mode === 'block' && (
                <div className="space-y-3">
                  <label className="block space-y-1.5 font-semibold text-[var(--os-text-secondary)]">
                    <span>Kiểu khối Block</span>
                    <select
                      className={CONTROL_CLASS}
                      value={settings.blockStyle}
                      onChange={(e) => updateSettings({ blockStyle: e.target.value })}
                    >
                      <option value="shade">Shade blocks (░▒▓█)</option>
                      <option value="half">Half blocks (▀▄)</option>
                    </select>
                  </label>
                  <label className="block space-y-1 font-semibold text-[var(--os-text-secondary)]">
                    <div className="flex justify-between">
                      <span>Ngưỡng Block</span>
                      <span className="font-mono">{settings.blockThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={settings.blockThreshold}
                      onChange={(e) => updateNumber('blockThreshold', e.target.value)}
                      className={RANGE_CLASS}
                    />
                  </label>
                </div>
              )}

              {settings.mode === 'dither' && (
                <div className="space-y-3">
                  <label className="block space-y-1.5 font-semibold text-[var(--os-text-secondary)]">
                    <span>Thuật toán Dither</span>
                    <select
                      className={CONTROL_CLASS}
                      value={settings.ditherAlgorithm}
                      onChange={(e) => updateSettings({ ditherAlgorithm: e.target.value })}
                    >
                      <option value="floyd-steinberg">Floyd–Steinberg</option>
                      <option value="ordered">Ordered Bayer</option>
                      <option value="atkinson">Atkinson</option>
                    </select>
                  </label>
                  <label className="block space-y-1 font-semibold text-[var(--os-text-secondary)]">
                    <div className="flex justify-between">
                      <span>Cường độ Dither</span>
                      <span className="font-mono">{settings.ditherStrength}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.ditherStrength}
                      onChange={(e) => updateNumber('ditherStrength', e.target.value)}
                      className={RANGE_CLASS}
                    />
                  </label>
                </div>
              )}

              {settings.mode === 'edge' && (
                <div className="space-y-3">
                  <label className="block space-y-1 font-semibold text-[var(--os-text-secondary)]">
                    <div className="flex justify-between">
                      <span>Ngưỡng viền (Edge)</span>
                      <span className="font-mono">{settings.edgeThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.edgeThreshold}
                      onChange={(e) => updateNumber('edgeThreshold', e.target.value)}
                      className={RANGE_CLASS}
                    />
                  </label>
                  <label className="block space-y-1 font-semibold text-[var(--os-text-secondary)]">
                    <div className="flex justify-between">
                      <span>Độ đậm viền</span>
                      <span className="font-mono">{settings.edgeStrength}</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="4"
                      step="0.1"
                      value={settings.edgeStrength}
                      onChange={(e) => updateNumber('edgeStrength', e.target.value)}
                      className={RANGE_CLASS}
                    />
                  </label>
                </div>
              )}

              {settings.mode === 'braille' && (
                <label className="block space-y-1 font-semibold text-[var(--os-text-secondary)]">
                  <div className="flex justify-between">
                    <span>Ngưỡng chấm Braille</span>
                    <span className="font-mono">{settings.brailleThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={settings.brailleThreshold}
                    onChange={(e) => updateNumber('brailleThreshold', e.target.value)}
                    className={RANGE_CLASS}
                  />
                </label>
              )}

              <div className="grid grid-cols-2 gap-2.5 border-t border-[var(--os-border-subtle)] pt-3">
                <label className="space-y-1 font-semibold text-[var(--os-text-secondary)]">
                  <span>Tỷ lệ khung</span>
                  <select
                    className={CONTROL_CLASS}
                    value={settings.cropAspect}
                    onChange={(e) => updateSettings({ cropAspect: e.target.value })}
                  >
                    {['original', 'free', '1:1', '4:3', '16:9', '9:16'].map((r) => (
                      <option key={r} value={r}>
                        {r === 'original' ? 'Gốc' : r === 'free' ? 'Tự do' : r}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 font-semibold text-[var(--os-text-secondary)]">
                  <span>Khớp khung</span>
                  <select
                    className={CONTROL_CLASS}
                    value={settings.fitMode}
                    onChange={(e) => updateSettings({ fitMode: e.target.value })}
                  >
                    <option value="cover">Lấp đầy (Cover)</option>
                    <option value="contain">Vừa vặn (Contain)</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1 font-semibold text-[var(--os-text-secondary)]">
                <div className="flex justify-between">
                  <span>Thu phóng vùng cắt</span>
                  <span className="font-mono">{settings.zoom.toFixed(1)}×</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={settings.zoom}
                  onChange={(e) => updateNumber('zoom', e.target.value)}
                  className={RANGE_CLASS}
                />
              </label>

              {settings.zoom > 1 && (
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="space-y-1 font-semibold text-[var(--os-text-secondary)]">
                    <span>Dịch ngang</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.panX}
                      onChange={(e) => updateNumber('panX', e.target.value)}
                      className={RANGE_CLASS}
                    />
                  </label>
                  <label className="space-y-1 font-semibold text-[var(--os-text-secondary)]">
                    <span>Dịch dọc</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.panY}
                      onChange={(e) => updateNumber('panY', e.target.value)}
                      className={RANGE_CLASS}
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TONE & EXPOSURE */}
          {inspectorTab === 'tone' && (
            <div className="space-y-3 text-xs">
              {[
                ['brightness', 'Độ sáng (Brightness)', -100, 100, 1],
                ['contrast', 'Tương phản (Contrast)', -100, 100, 1],
                ['gamma', 'Gamma', 0.4, 2.4, 0.05],
                ['exposure', 'Phơi sáng (Exposure)', -2, 2, 0.1],
                ['saturation', 'Bão hòa màu', 0, 200, 1],
                ['blur', 'Làm mịn nhiễu', 0, 100, 1],
                ['sharpness', 'Độ sắc nét', 0, 100, 1],
              ].map(([key, label, min, max, step]) => (
                <label
                  key={key}
                  className="block space-y-1 font-semibold text-[var(--os-text-secondary)]"
                >
                  <div className="flex justify-between">
                    <span>{label}</span>
                    <span className="font-mono text-[var(--os-text-primary)]">
                      {settings[key]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={settings[key]}
                    onChange={(e) => updateNumber(key, e.target.value)}
                    className={RANGE_CLASS}
                  />
                </label>
              ))}

              <div className="space-y-2 border-t border-[var(--os-border-subtle)] pt-3">
                <label className="flex items-center justify-between font-semibold text-[var(--os-text-secondary)] cursor-pointer">
                  <span>Đảo ngược sáng tối (Invert)</span>
                  <input
                    type="checkbox"
                    checked={settings.invert}
                    onChange={(e) => updateSettings({ invert: e.target.checked })}
                    className="accent-[var(--os-accent)] size-4"
                  />
                </label>

                <label className="flex items-center justify-between font-semibold text-[var(--os-text-secondary)] cursor-pointer">
                  <span>Áp dụng ngưỡng nhị phân (Threshold)</span>
                  <input
                    type="checkbox"
                    checked={settings.thresholdEnabled}
                    onChange={(e) => updateSettings({ thresholdEnabled: e.target.checked })}
                    className="accent-[var(--os-accent)] size-4"
                  />
                </label>

                {settings.thresholdEnabled && (
                  <label className="block space-y-1 pt-1 font-semibold text-[var(--os-text-secondary)]">
                    <div className="flex justify-between">
                      <span>Mức ngưỡng</span>
                      <span className="font-mono">{settings.threshold}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={settings.threshold}
                      onChange={(e) => updateNumber('threshold', e.target.value)}
                      className={RANGE_CLASS}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TYPOGRAPHY, COLORS & PRESET SAVE */}
          {inspectorTab === 'style' && (
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <label className="space-y-1 font-semibold text-[var(--os-text-secondary)]">
                  <span>Màu ký tự</span>
                  <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] p-1.5">
                    <input
                      type="color"
                      value={settings.foreground}
                      onChange={(e) => updateSettings({ foreground: e.target.value })}
                      className="size-6 rounded border-0 bg-transparent p-0 cursor-pointer"
                    />
                    <span className="font-mono text-[11px]">{settings.foreground}</span>
                  </div>
                </label>
                <label className="space-y-1 font-semibold text-[var(--os-text-secondary)]">
                  <span>Màu nền</span>
                  <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] p-1.5">
                    <input
                      type="color"
                      value={settings.background}
                      onChange={(e) => updateSettings({ background: e.target.value })}
                      className="size-6 rounded border-0 bg-transparent p-0 cursor-pointer"
                    />
                    <span className="font-mono text-[11px]">{settings.background}</span>
                  </div>
                </label>
              </div>

              <label className="block space-y-1.5 font-semibold text-[var(--os-text-secondary)]">
                <span>Phông chữ Monospace</span>
                <select
                  className={CONTROL_CLASS}
                  value={selectedFontPreset}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') updateSettings({ fontFamily: e.target.value });
                  }}
                >
                  <option value={FONT_STACKS[0]}>System Monospace</option>
                  <option value={FONT_STACKS[1]}>JetBrains Mono</option>
                  <option value={FONT_STACKS[2]}>Generic Monospace</option>
                  <option value="custom">Tùy chỉnh...</option>
                </select>
              </label>

              {selectedFontPreset === 'custom' && (
                <input
                  aria-label="Custom font stack"
                  value={settings.fontFamily}
                  onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                  className={CONTROL_CLASS}
                  placeholder="ui-monospace, monospace"
                />
              )}

              {[
                ['fontSize', 'Cỡ chữ xuất ảnh', 6, 18, 1, 'px'],
                ['lineHeight', 'Giãn dòng', 0.8, 1.5, 0.05, ''],
                ['characterSpacing', 'Giãn ký tự', -1, 5, 0.25, 'px'],
                ['padding', 'Lề khung ảnh', 0, 80, 2, 'px'],
              ].map(([key, label, min, max, step, unit]) => (
                <label
                  key={key}
                  className="block space-y-1 font-semibold text-[var(--os-text-secondary)]"
                >
                  <div className="flex justify-between">
                    <span>{label}</span>
                    <span className="font-mono">
                      {settings[key]}
                      {unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={settings[key]}
                    onChange={(e) => updateNumber(key, e.target.value)}
                    className={RANGE_CLASS}
                  />
                </label>
              ))}

              <label className="block space-y-1.5 font-semibold text-[var(--os-text-secondary)]">
                <span>Tỷ lệ ô ký tự ({settings.characterAspect.toFixed(2)})</span>
                <select
                  className={CONTROL_CLASS}
                  value={settings.characterAspectPreset}
                  onChange={(e) => {
                    const aspect = {
                      terminal: 0.52,
                      monospace: 0.6,
                      browser: 0.62,
                      square: 1,
                      custom: settings.characterAspect,
                    }[e.target.value];
                    updateSettings({
                      characterAspectPreset: e.target.value,
                      characterAspect: aspect,
                    });
                  }}
                >
                  <option value="terminal">Terminal (0.52)</option>
                  <option value="monospace">Monospace (0.60)</option>
                  <option value="browser">Browser (0.62)</option>
                  <option value="square">Vuông (1.00)</option>
                  <option value="custom">Tùy chỉnh</option>
                </select>
              </label>

              {settings.characterAspectPreset === 'custom' && (
                <input
                  type="range"
                  min="0.35"
                  max="1"
                  step="0.01"
                  value={settings.characterAspect}
                  onChange={(e) => updateNumber('characterAspect', e.target.value)}
                  className={RANGE_CLASS}
                />
              )}

              {/* Save Custom Preset */}
              <div className="space-y-2 border-t border-[var(--os-border-subtle)] pt-3">
                <span className="block font-semibold text-[var(--os-text-secondary)]">
                  Lưu cấu hình thành Preset riêng
                </span>
                <div className="flex gap-1.5">
                  <input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Tên preset mới..."
                    className={CONTROL_CLASS}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Save size={13} />}
                    onClick={savePreset}
                  >
                    Lưu
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[var(--os-accent)] hover:underline cursor-pointer"
                >
                  <Download size={12} />
                  <span>Xuất cấu hình JSON</span>
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT ARTBOARD & EXPORT STAGE */}
        <div ref={previewPanelRef} className="min-w-0 space-y-3">
          {/* Stage Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] px-3.5 py-2.5">
            <StudioSegmentedBar
              items={STAGE_VIEWS}
              activeId={stageView}
              onSelect={setStageView}
              layoutId="ascii-stage-view-pill"
              ariaLabel="Chế độ xem khung vẽ"
              size="sm"
            />

            <div className="flex items-center gap-2">
              <span className="hidden xl:inline-block font-mono text-xs text-[var(--os-text-muted)]">
                {processing
                  ? 'Đang tính toán...'
                  : result
                  ? `${result.columns}×${result.rows} · ${(
                      result.columns * result.rows
                    ).toLocaleString()} ký tự`
                  : 'Chưa nạp ảnh'}
              </span>

              <div className="os-sunken flex items-center rounded-[var(--radius-sm)] p-0.5">
                <button
                  type="button"
                  onClick={() => setZoom((c) => Math.max(50, c - 25))}
                  disabled={!result}
                  aria-label="Thu nhỏ bản xem trước"
                  className="rounded p-1.5 text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)] disabled:opacity-40 cursor-pointer"
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(100)}
                  disabled={!result}
                  className="min-w-11 px-1 font-mono text-[11px] font-bold text-[var(--os-text-primary)] disabled:opacity-40 cursor-pointer"
                >
                  {zoom}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((c) => Math.min(200, c + 25))}
                  disabled={!result}
                  aria-label="Phóng to bản xem trước"
                  className="rounded p-1.5 text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)] disabled:opacity-40 cursor-pointer"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => previewPanelRef.current?.requestFullscreen?.()}
                  disabled={!result}
                  aria-label="Toàn màn hình"
                  className="rounded p-1.5 text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)] disabled:opacity-40 cursor-pointer"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Empty Dropzone or Active Canvas Grid */}
          {!source ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDropActive(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setDropActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDropActive(false);
                void selectFile(e.dataTransfer.files[0]);
              }}
              onPaste={handlePaste}
              tabIndex={0}
              aria-label="Vùng chọn ảnh. Kéo thả hoặc dán ảnh bằng Ctrl+V."
              className={`os-focus-ring flex min-h-[380px] flex-col items-center justify-center rounded-[var(--radius-xl)] border-2 border-dashed p-8 text-center transition-colors ${
                dropActive
                  ? 'border-[var(--os-accent)] bg-[var(--os-accent-soft)]'
                  : 'border-[var(--os-border-strong)] bg-[var(--os-surface-1)]'
              }`}
            >
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
                <ImageIcon size={26} />
              </div>
              <h4 className="text-base sm:text-lg font-extrabold text-[var(--os-text-primary)]">
                Kéo thả ảnh, dán Ctrl+V hoặc chọn tệp từ máy
              </h4>
              <p className="mt-1 max-w-md text-xs sm:text-sm text-[var(--os-text-muted)]">
                Hỗ trợ PNG, JPG, WEBP, GIF, BMP tối đa 20 MB. Toàn bộ quá trình giải mã và dựng ký tự diễn ra ngay trên trình duyệt của bạn.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <Button
                  variant="primary"
                  size="md"
                  icon={<Upload size={15} />}
                  onClick={() => uploadRef.current?.click()}
                >
                  Chọn ảnh từ thiết bị
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Wand2 size={15} />}
                  onClick={() => void loadSample()}
                >
                  Dùng ảnh mẫu thử ngay
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`grid gap-3 ${
                stageView === 'split' ? 'xl:grid-cols-[0.78fr_1.22fr]' : 'grid-cols-1'
              }`}
            >
              {/* Source Preview Pane */}
              {(stageView === 'split' || stageView === 'source') && (
                <section className="flex flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-3">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
                        Ảnh đầu vào
                      </span>
                      <p className="truncate text-xs font-semibold text-[var(--os-text-primary)]">
                        {source.file.name} · {source.width}×{source.height}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="os-focus-ring inline-flex items-center gap-1 rounded-[var(--radius-xs)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2 py-1 text-[11px] font-semibold text-[var(--os-text-secondary)] hover:text-[var(--os-danger)] cursor-pointer"
                    >
                      <X size={12} />
                      <span>Gỡ ảnh</span>
                    </button>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropActive(true);
                    }}
                    onDragLeave={() => setDropActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDropActive(false);
                      void selectFile(e.dataTransfer.files[0]);
                    }}
                    className="flex min-h-60 flex-1 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[#080b10] p-2"
                  >
                    <img
                      src={imageUrl}
                      alt={`Ảnh gốc ${source.file.name}`}
                      className="max-h-[400px] w-full object-contain"
                    />
                  </div>
                </section>
              )}

              {/* Rendered ASCII Artboard */}
              {(stageView === 'split' || stageView === 'result') && (
                <section className="flex flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-3">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--os-accent)]">
                      Bản dựng ký tự ({settings.mode.toUpperCase()})
                    </span>
                    {processing && (
                      <button
                        type="button"
                        onClick={cancelRender}
                        className="font-mono text-[11px] font-semibold text-[var(--os-danger)] hover:underline cursor-pointer"
                      >
                        Hủy xử lý
                      </button>
                    )}
                  </div>

                  <div className="max-h-[460px] min-h-60 flex-1 overflow-auto custom-scrollbar rounded-[var(--radius-md)] border border-slate-800 bg-[#070a0f] p-2.5">
                    {result ? (
                      <>
                        <canvas
                          ref={resultCanvasRef}
                          role="img"
                          aria-label="Bản xem trước kết quả ASCII"
                          className="block h-auto max-w-none"
                          style={{ width: `${zoom}%` }}
                        />
                        <pre className="sr-only" aria-label="Nội dung văn bản ASCII">
                          {result.text}
                        </pre>
                      </>
                    ) : (
                      <div className="flex h-60 items-center justify-center text-xs text-slate-400">
                        {processing ? (
                          <span className="inline-flex items-center gap-2 font-mono">
                            <LoaderCircle className="animate-spin text-[var(--os-accent)]" size={16} />
                            Đang kết xuất lưới ký tự...
                          </span>
                        ) : (
                          'Kết quả sẽ xuất hiện tại đây.'
                        )}
                      </div>
                    )}
                  </div>

                  {wrap && result && (
                    <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded-[var(--radius-sm)] bg-[#070a0f] p-2.5 font-mono text-[10px] text-slate-300">
                      {result.text}
                    </pre>
                  )}
                </section>
              )}
            </div>
          )}

          {/* Export Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] px-3.5 py-2.5">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[var(--os-text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={wrap}
                onChange={(e) => setWrap(e.target.checked)}
                className="accent-[var(--os-accent)] size-3.5"
              />
              <span>Xem thêm khung văn bản thô (Wrap)</span>
            </label>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={!result}
                className={EXPORT_BTN_CLASS}
              >
                <Copy size={13} />
                <span>Copy Text</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadText}
                disabled={!result}
                className={EXPORT_BTN_CLASS}
              >
                <FileText size={13} />
                <span>TXT</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={!result}
                className={EXPORT_BTN_CLASS}
              >
                <FileImage size={13} />
                <span>PNG</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadSvg}
                disabled={!result}
                className={EXPORT_BTN_CLASS}
              >
                <ImageIcon size={13} />
                <span>SVG</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadHtml}
                disabled={!result}
                className={EXPORT_BTN_CLASS}
              >
                <Code2 size={13} />
                <span>HTML</span>
              </button>
              {isColored && (
                <button
                  type="button"
                  onClick={() => void copyHtml()}
                  disabled={!result}
                  className={EXPORT_BTN_CLASS}
                >
                  <Check size={13} />
                  <span>Copy HTML</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
