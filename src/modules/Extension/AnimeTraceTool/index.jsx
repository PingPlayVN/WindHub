import { useEffect, useRef, useState } from 'react';
import {
  Award,
  Clock3,
  ExternalLink,
  FileImage,
  ImagePlus,
  RefreshCw,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/os/Button';
import Modal from '@/components/os/Modal';
import { StudioWorkspaceHeader, ToolEmblem } from '@/components/studio/StudioPrimitives';

const TRACE_API = 'https://api.trace.moe/search';

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '--:--';
  const totalSeconds = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(
    totalSeconds % 60
  ).padStart(2, '0')}`;
};

const getTitle = (result) =>
  result?.anilist?.title?.english ||
  result?.anilist?.title?.romaji ||
  result?.anilist?.title?.native ||
  result?.filename ||
  'Không rõ tên anime';

const getEpisodeLabel = (episode) => (episode ? `Tập ${episode}` : 'Không xác định tập');

function ResultCard({ result, index }) {
  const title = getTitle(result);
  const confidence = Math.round((result.similarity || 0) * 100);
  const previewUrl = result.image || result.video;
  const isBestMatch = index === 0;
  const confidenceLabel =
    confidence >= 80 ? 'Độ khớp cao' : confidence >= 60 ? 'Khả năng khớp' : 'Tham khảo';

  return (
    <article
      className={`overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--os-surface-1)] transition-colors ${
        isBestMatch
          ? 'border-[var(--os-accent-border)] shadow-[var(--os-shadow-sm)]'
          : 'border-[var(--os-border-default)]'
      }`}
    >
      {isBestMatch && (
        <div className="flex items-center gap-2 border-b border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--os-accent)]">
          <Award size={13} />
          <span>Kết quả tương đồng cao nhất</span>
        </div>
      )}

      <div
        className={`grid gap-0 ${
          isBestMatch ? 'md:grid-cols-[minmax(220px,36%)_1fr]' : 'sm:grid-cols-[160px_1fr]'
        }`}
      >
        <div
          className={`relative overflow-hidden bg-[#090c11] ${
            isBestMatch
              ? 'aspect-video md:aspect-auto md:min-h-48'
              : 'aspect-video sm:aspect-auto sm:min-h-32'
          }`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`Khung hình kết quả ${index + 1}`}
              className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-600">
              <FileImage size={26} />
            </div>
          )}
          <span className="absolute left-2.5 top-2.5 rounded-md bg-black/75 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
            #{index + 1}
          </span>
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
                Anime nhận diện
              </p>
              <h4
                className={`mt-0.5 line-clamp-2 font-extrabold leading-snug text-[var(--os-text-primary)] ${
                  isBestMatch ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                }`}
                title={title}
              >
                {title}
              </h4>
            </div>

            <div className="shrink-0 text-right">
              <strong
                className={`block font-mono text-lg leading-none ${
                  confidence >= 80 ? 'text-[var(--os-success)]' : 'text-[var(--os-warning)]'
                }`}
              >
                {confidence}%
              </strong>
              <span className="mt-1 block text-[10px] text-[var(--os-text-muted)]">
                {confidenceLabel}
              </span>
            </div>
          </div>

          <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-[var(--os-surface-3)]">
            <div
              className={`h-full rounded-full ${
                confidence >= 80 ? 'bg-[var(--os-success)]' : 'bg-[var(--os-warning)]'
              }`}
              style={{ width: `${confidence}%` }}
            />
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-[var(--radius-xs)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] px-2.5 py-1 font-semibold text-[var(--os-text-secondary)]">
              {getEpisodeLabel(result.episode)}
            </span>
            <span className="rounded-[var(--radius-xs)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] px-2.5 py-1 font-mono font-semibold text-[var(--os-text-secondary)]">
              {formatTime(result.from)} – {formatTime(result.to)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {result.video && (
              <a
                href={result.video}
                target="_blank"
                rel="noreferrer"
                className="os-focus-ring inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--os-accent)] px-3 py-1.5 text-xs font-bold text-[var(--os-accent-fg)] transition hover:bg-[var(--os-accent-hover)]"
              >
                <ExternalLink size={13} />
                <span>Xem trích đoạn</span>
              </a>
            )}
            {result.anilist?.id && (
              <a
                href={`https://anilist.co/anime/${result.anilist.id}`}
                target="_blank"
                rel="noreferrer"
                className="os-focus-ring inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--os-text-primary)] transition hover:border-[var(--os-border-strong)]"
              >
                <ExternalLink size={13} />
                <span>Trang AniList</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function AnimeTraceWorkspace() {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [recentItems, setRecentItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('anime-trace-recent') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('anime-trace-recent', JSON.stringify(recentItems.slice(0, 4)));
  }, [recentItems]);

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const selectFile = (file) => {
    if (!file) return;
    const imageFile =
      file instanceof File
        ? file
        : new File([file], `clipboard-image-${Date.now()}.png`, {
            type: file.type || 'image/png',
          });
    if (!imageFile.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ');
      return;
    }
    if (imageFile.size > 10 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 10 MB');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(imageFile);
    setImageUrl('');
    setPreviewUrl(URL.createObjectURL(imageFile));
    setResults([]);
    setError('');
  };

  const handlePaste = (event) => {
    const imageItem = Array.from(event.clipboardData?.items || []).find((item) =>
      item.type.startsWith('image/')
    );
    const pastedImage = imageItem?.getAsFile();
    if (!pastedImage) return;
    event.preventDefault();
    selectFile(pastedImage);
    toast.success('Đã nhận ảnh từ Clipboard');
  };

  const handleSearch = async (event, retrySource) => {
    event?.preventDefault();
    const trimmedUrl = imageUrl.trim();
    const sourceImage = retrySource || selectedFile;
    if (!sourceImage && !trimmedUrl) {
      setError('Hãy tải một khung hình lên hoặc nhập URL ảnh trước khi tra cứu.');
      return;
    }

    setIsSearching(true);
    setError('');
    setResults([]);
    try {
      let response;
      if (sourceImage && typeof sourceImage !== 'string') {
        const formData = new FormData();
        formData.append('file', sourceImage);
        response = await fetch(TRACE_API, { method: 'POST', body: formData });
      } else {
        const targetUrl = typeof sourceImage === 'string' ? sourceImage : trimmedUrl;
        const url = new URL(TRACE_API);
        url.searchParams.set('url', targetUrl);
        response = await fetch(url);
      }
      if (!response.ok) throw new Error(`trace.moe returned ${response.status}`);
      const data = await response.json();
      const nextResults = Array.isArray(data.result) ? data.result : [];
      if (!nextResults.length) {
        setError(
          'Không tìm thấy cảnh phim trùng khớp. Hãy thử khung hình gốc không bị cắt viền hoặc che phụ đề.'
        );
      } else {
        const itemKey =
          typeof sourceImage === 'string'
            ? sourceImage
            : sourceImage?.name || previewUrl || 'uploaded-image';
        setRecentItems((current) =>
          [
            {
              id: `${Date.now()}-${itemKey}`,
              label: itemKey,
              isUrl: typeof sourceImage === 'string' || Boolean(trimmedUrl && !selectedFile),
              preview: previewUrl || '',
              time: new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
            ...current.filter((item) => item.label !== itemKey),
          ].slice(0, 4)
        );
      }
      setResults(nextResults);
    } catch (searchError) {
      console.error('Anime trace error:', searchError);
      setError(
        'Không thể kết nối máy chủ nhận diện trace.moe lúc này. Hãy kiểm tra mạng và thử lại.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-6 text-[var(--os-text-primary)]">
      <StudioWorkspaceHeader
        eyebrow="VISION // SCENE MATCHER"
        title="Anime Frame Finder"
        description="Nhận diện tên bộ anime, số tập và mốc thời gian xuất hiện chính xác từ một ảnh chụp màn hình bất kỳ."
        emblemVariant="anime-trace"
        tone="violet"
        badges={['trace.moe Engine', 'AniList Sync']}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<Upload size={14} />}
            onClick={() => inputRef.current?.click()}
          >
            Chọn khung hình
          </Button>
        }
      />

      <form onSubmit={handleSearch} className="space-y-4">
        {/* Dropzone & Clipboard Frame Capture */}
        <div
          onPaste={handlePaste}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            selectFile(e.dataTransfer.files[0]);
          }}
          tabIndex={0}
          className="os-focus-ring rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--os-border-strong)] bg-[var(--os-surface-1)] p-6 text-center transition-colors hover:border-[var(--os-accent-border)]"
        >
          {previewUrl ? (
            <div className="relative mx-auto max-w-md overflow-hidden rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[#090c11]">
              <img
                src={previewUrl}
                alt="Khung hình sẽ được tra cứu"
                className="max-h-60 w-full object-contain"
              />
              <button
                type="button"
                onClick={clearSelection}
                aria-label="Xóa ảnh đã chọn"
                className="absolute right-2.5 top-2.5 rounded-full bg-black/75 p-1.5 text-white hover:bg-rose-600 cursor-pointer transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="py-3">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/12 text-violet-500">
                <ImagePlus size={24} />
              </div>
              <p className="text-sm sm:text-base font-bold text-[var(--os-text-primary)]">
                Kéo thả khung hình anime hoặc nhấn Ctrl+V để dán ảnh
              </p>
              <p className="mt-1 text-xs text-[var(--os-text-muted)]">
                Hỗ trợ PNG, JPG, WEBP tối đa 10 MB · Ảnh nguyên khung không cắt xén cho độ chính xác cao nhất
              </p>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(event) => selectFile(event.target.files[0])}
            className="sr-only"
          />

          {!previewUrl && (
            <div className="mt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Upload size={14} />}
                onClick={() => inputRef.current?.click()}
              >
                Tải ảnh từ thiết bị
              </Button>
            </div>
          )}
        </div>

        {/* Direct Image URL + Submit Row */}
        <div className="flex flex-col gap-2.5 rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-3.5 sm:flex-row">
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => {
              setImageUrl(event.target.value);
              setSelectedFile(null);
              setPreviewUrl('');
              setError('');
            }}
            placeholder="Hoặc dán liên kết ảnh trực tiếp (https://.../frame.jpg)..."
            aria-label="URL hình ảnh anime"
            className="os-focus-ring h-11 min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3.5 text-xs sm:text-sm text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)] focus:bg-[var(--os-surface-1)]"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSearching}
            icon={<Search size={16} />}
          >
            {isSearching ? 'Đang đối chiếu...' : 'Tra cứu cảnh phim'}
          </Button>
        </div>
      </form>

      {/* Recent Lookups */}
      {recentItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-1)] px-3.5 py-2.5">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
            <Clock3 size={12} />
            <span>Gần đây:</span>
          </span>
          {recentItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (/^https?:\/\//i.test(item.label)) {
                  setImageUrl(item.label);
                  setSelectedFile(null);
                  setPreviewUrl('');
                  setError('');
                  void handleSearch({ preventDefault: () => {} }, item.label);
                } else {
                  toast.info('Tệp cục bộ trước đó cần được chọn lại từ máy của bạn.');
                }
              }}
              className="os-focus-ring inline-flex items-center gap-1.5 rounded-full border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs text-[var(--os-text-secondary)] hover:border-[var(--os-accent-border)] hover:text-[var(--os-text-primary)] cursor-pointer transition-colors"
            >
              <span className="max-w-36 truncate">{item.label}</span>
              {item.time && (
                <span className="font-mono text-[10px] text-[var(--os-text-muted)]">
                  · {item.time}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {isSearching && (
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-4 animate-pulse">
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="h-36 rounded-[var(--radius-md)] bg-[var(--os-surface-3)]" />
            <div className="space-y-3 py-2">
              <div className="h-4 w-2/3 rounded bg-[var(--os-surface-3)]" />
              <div className="h-3 w-1/3 rounded bg-[var(--os-surface-2)]" />
              <div className="h-2 w-full rounded bg-[var(--os-surface-2)]" />
            </div>
          </div>
        </div>
      )}

      {/* Error Notice with Retry */}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--os-warning-border)] bg-[var(--os-warning-soft)] p-3.5 text-xs sm:text-sm text-[var(--os-text-primary)]"
        >
          <span>{error}</span>
          {error.includes('Không thể kết nối') && (
            <Button
              variant="secondary"
              size="xs"
              icon={<RefreshCw size={13} />}
              onClick={(event) => void handleSearch(event, selectedFile || imageUrl)}
            >
              Thử lại
            </Button>
          )}
        </div>
      )}

      {/* Matched Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-end justify-between border-b border-[var(--os-border-subtle)] pb-2.5">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[var(--os-text-primary)]">
                Kết quả đối chiếu khung hình
              </h3>
              <p className="text-xs text-[var(--os-text-muted)]">
                Độ tương đồng từ 85% trở lên thường khớp chính xác cảnh phim gốc.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-[var(--os-text-muted)]">
              {results.length} kết quả
            </span>
          </div>

          <div className="space-y-3.5">
            {results.map((result, index) => (
              <ResultCard
                key={`${result.anilist?.id || result.filename}-${result.episode}-${index}`}
                result={result}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnimeTraceTool({ embedded = false }) {
  const [isOpen, setIsOpen] = useState(false);

  if (embedded) {
    return <AnimeTraceWorkspace />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="os-card os-card-interactive os-focus-ring w-full p-5 text-left cursor-pointer"
        aria-label="Mở Anime Frame Finder"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[var(--radius-sm)] border border-violet-500/30 bg-violet-500/12 text-violet-500">
            <ToolEmblem variant="anime-trace" size={20} />
          </span>
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-violet-500">
              Vision · trace.moe
            </span>
            <h3 className="text-base font-bold text-[var(--os-text-primary)]">
              Anime Frame Finder
            </h3>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[var(--os-text-secondary)]">
          Tải một khung hình anime lên để tìm tên phim, số tập và thời điểm xuất hiện bằng trace.moe.
        </p>
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        size="xl"
        subtitle="WINDOS EXTENSION"
        title="Anime Frame Finder"
      >
        <AnimeTraceWorkspace />
      </Modal>
    </>
  );
}

AnimeTraceTool.tool = { id: 'anime-frame-finder', Component: AnimeTraceTool };
export default AnimeTraceTool;
