import { useEffect, useRef, useState } from 'react';
import { Clock3, ExternalLink, FileImage, ImagePlus, RefreshCw, Search, Sparkles, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const TRACE_API = 'https://api.trace.moe/search';

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '--:--';
  const totalSeconds = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
};

const getTitle = (result) => result?.anilist?.title?.english
  || result?.anilist?.title?.romaji
  || result?.anilist?.title?.native
  || result?.filename
  || 'Không rõ tên anime';

const getEpisodeLabel = (episode) => episode ? `Tập ${episode}` : 'Không xác định tập';

function ResultCard({ result, index }) {
  const title = getTitle(result);
  const confidence = Math.round((result.similarity || 0) * 100);
  const previewUrl = result.image || result.video;
  const isBestMatch = index === 0;
  const confidenceLabel = confidence >= 80 ? 'Rất khớp' : confidence >= 60 ? 'Có thể khớp' : 'Khớp thấp';

  return (
    <article className={`overflow-hidden rounded-2xl border bg-[#11121a] transition-colors ${isBestMatch ? 'border-violet-400/50 shadow-[0_14px_40px_rgba(124,58,237,0.14)]' : 'border-slate-800/90 hover:border-violet-900/70'}`}>
      {isBestMatch && <div className="flex items-center gap-2 border-b border-violet-400/20 bg-violet-500/[0.08] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200"><Sparkles size={13} /> Kết quả phù hợp nhất</div>}
      <div className={`grid gap-0 ${isBestMatch ? 'md:grid-cols-[minmax(220px,38%)_1fr]' : 'sm:grid-cols-[150px_1fr]'}`}>
        <div className={`relative overflow-hidden bg-black ${isBestMatch ? 'aspect-video md:aspect-auto md:min-h-52' : 'aspect-video sm:aspect-auto sm:min-h-32'}`}>
          {previewUrl ? <img src={previewUrl} alt={`Khung hình kết quả ${index + 1}`} className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" loading="lazy" /> : <div className="flex h-full items-center justify-center text-slate-600"><FileImage size={28} /></div>}
          <span className="absolute left-3 top-3 rounded-md bg-black/75 px-2 py-1 font-mono text-[10px] text-slate-200">#{index + 1}</span>
        </div>
        <div className={`min-w-0 ${isBestMatch ? 'p-5' : 'p-4'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Anime nhận diện</p>
              <h3 className={`${isBestMatch ? 'text-lg' : 'text-base'} line-clamp-2 font-bold leading-tight text-white`} title={title}>{title}</h3>
            </div>
            <div className="shrink-0 text-right"><strong className={`block font-mono text-lg leading-none ${confidence >= 80 ? 'text-emerald-300' : 'text-amber-300'}`}>{confidence}%</strong><span className="mt-1 block text-[10px] text-slate-500">{confidenceLabel}</span></div>
          </div>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${confidence >= 80 ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${confidence}%` }} /></div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-slate-300">{getEpisodeLabel(result.episode)}</span>
            <span className="rounded-lg bg-slate-800/80 px-2.5 py-1.5 font-mono text-slate-300">{formatTime(result.from)} - {formatTime(result.to)}</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {result.video && <a href={result.video} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-400"><ExternalLink size={13} /> Xem đoạn phim</a>}
            {result.anilist?.id && <a href={`https://anilist.co/anime/${result.anilist.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"><ExternalLink size={13} /> AniList</a>}
          </div>
        </div>
      </div>
    </article>
  );
}

function AnimeTraceTool() {
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
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
    const imageFile = file instanceof File ? file : new File([file], `clipboard-image-${Date.now()}.png`, { type: file.type || 'image/png' });
    if (!imageFile.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
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
    const imageItem = Array.from(event.clipboardData?.items || []).find((item) => item.type.startsWith('image/'));
    const pastedImage = imageItem?.getAsFile();
    if (!pastedImage) return;
    event.preventDefault();
    selectFile(pastedImage);
    toast.success('Đã lấy ảnh từ clipboard');
  };

  const handleSearch = async (event, retrySource) => {
    event?.preventDefault();
    const trimmedUrl = imageUrl.trim();
    const sourceImage = retrySource || selectedFile;
    if (!sourceImage && !trimmedUrl) {
      setError('Hãy chọn ảnh hoặc nhập URL ảnh trước khi tra cứu.');
      return;
    }

    setIsSearching(true);
    setError('');
    setResults([]);
    try {
      let response;
      if (sourceImage) {
        const formData = new FormData();
        formData.append('file', sourceImage);
        response = await fetch(TRACE_API, { method: 'POST', body: formData });
      } else {
        const url = new URL(TRACE_API);
        url.searchParams.set('url', trimmedUrl);
        response = await fetch(url);
      }
      if (!response.ok) throw new Error(`trace.moe returned ${response.status}`);
      const data = await response.json();
      const nextResults = Array.isArray(data.result) ? data.result : [];
      if (!nextResults.length) {
        setError('Không tìm thấy anime phù hợp với ảnh này. Hãy thử ảnh rõ hơn hoặc dùng khung hình khác.');
      } else {
        const itemKey = typeof sourceImage === 'string' ? sourceImage : (sourceImage?.name || previewUrl || 'uploaded-image');
        setRecentItems((current) => [
          { id: `${Date.now()}-${itemKey}`, label: itemKey, preview: previewUrl || '', time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) },
          ...current.filter((item) => item.label !== itemKey),
        ].slice(0, 4));
      }
      setResults(nextResults);
    } catch (searchError) {
      console.error('Anime trace error:', searchError);
      setError('Không thể tra cứu lúc này. Có thể do mạng hoặc API đang lỗi. Hãy thử lại hoặc dùng ảnh rõ nét hơn.');
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) {
    return (
      <button type="button" onClick={() => setIsOpen(true)} className="nhost-card text-left" aria-label="Mở Anime Frame Finder">
        <span className="card-grid" /><span className="card-glow" />
        <span className="card-header"><span className="brand-wrapper"><span className="logo-container border-violet-400/30 bg-violet-400/10"><Sparkles className="text-violet-300" size={22} /></span><span className="brand-text">Anime Frame Finder</span></span><span className="btn-icon"><Search className="icon" /></span></span>
        <span className="card-body"><span className="repo-title">Trace the scene<span className="blinking-cursor bg-violet-400" /></span><span className="repo-description text-slate-400">Tải một khung hình anime lên để tìm tên phim, tập và thời điểm xuất hiện bằng trace.moe.</span><span className="tag-wrapper"><span className="badge border-violet-400/20 bg-violet-400/10 text-violet-200">Image search</span><span className="badge border-emerald-500/20 bg-emerald-500/10 text-emerald-300">trace.moe API</span></span></span>
      </button>
    );
  }

  return (
    <div className="tool-modal fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <article className="tool-modal-panel relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-violet-900/50 bg-[#0b0b10] shadow-2xl">
        <header className="tool-modal-header flex shrink-0 items-center justify-between border-b border-violet-900/40 bg-[#11111a] p-5">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300"><Sparkles size={23} /></div><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300">windhub // anime lookup</p><h2 className="text-xl font-bold text-white">Anime Frame Finder</h2></div></div>
          <button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng công cụ" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"><X size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <form onSubmit={handleSearch} className="space-y-4">
            <div onPaste={handlePaste} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]); }} tabIndex={0} className="rounded-2xl border border-dashed border-violet-500/40 bg-violet-500/[0.04] p-5 text-center outline-none transition hover:border-violet-300/70 focus:border-violet-300/70 focus:ring-2 focus:ring-violet-500/20">
              {previewUrl ? <div className="relative mx-auto max-w-md"><img src={previewUrl} alt="Ảnh sẽ được tra cứu" className="max-h-56 w-full rounded-xl object-contain" /><button type="button" onClick={clearSelection} className="absolute right-2 top-2 rounded-full bg-black/75 p-2 text-white hover:bg-red-500/80" aria-label="Xóa ảnh đã chọn"><X size={15} /></button></div> : <><ImagePlus className="mx-auto mb-3 text-violet-300" size={34} /><p className="text-sm font-semibold text-slate-200">Kéo thả hoặc dán ảnh bằng Ctrl + V</p><p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP • tối đa 10 MB</p></>}
              <input ref={inputRef} type="file" accept="image/*" onChange={(event) => selectFile(event.target.files[0])} className="sr-only" />
              <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-violet-400/40 px-3 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/10"><Upload size={14} /> Chọn ảnh</button>
            </div>
            <div className="flex items-center gap-3"><div className="h-px flex-1 bg-slate-800" /><span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">hoặc dùng URL ảnh</span><div className="h-px flex-1 bg-slate-800" /></div>
            <div className="flex flex-col gap-3 sm:flex-row"><input type="url" value={imageUrl} onChange={(event) => { setImageUrl(event.target.value); setSelectedFile(null); setPreviewUrl(''); setError(''); }} placeholder="https://.../anime-frame.jpg" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-black px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-400" /><button type="submit" disabled={isSearching} className="tool-analyze-button flex items-center justify-center gap-2 rounded-xl !bg-violet-600 px-5 py-3 font-bold text-white transition hover:!bg-violet-500 disabled:cursor-wait disabled:opacity-60"><Search size={17} /> {isSearching ? 'Đang tìm...' : 'Tra cứu anime'}</button></div>
          </form>

          {recentItems.length > 0 && (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-[#101218] p-3">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400"><Clock3 size={12} /> Tra cứu gần đây</div>
              <div className="flex flex-wrap gap-2">
                {recentItems.map((item) => (
                  <button key={item.id} type="button" onClick={() => { setImageUrl(item.label); setSelectedFile(null); setPreviewUrl(item.preview || ''); setError(''); handleSearch({ preventDefault: () => {} }, item.label); }} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/50 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-violet-400 hover:text-white">
                    {item.preview ? <img src={item.preview} alt={item.label} className="h-6 w-6 rounded-full object-cover" /> : <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-violet-200">#</span>}
                    <span className="max-w-24 truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSearching && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between"><div className="h-3 w-28 animate-pulse rounded-full bg-slate-700" /><div className="h-3 w-16 animate-pulse rounded-full bg-slate-800" /></div>
              <div className="overflow-hidden rounded-2xl border border-violet-900/30 bg-[#11121a] p-3">
                <div className="grid gap-4 md:grid-cols-[200px_1fr]">
                  <div className="h-32 animate-pulse rounded-xl bg-slate-800" />
                  <div className="space-y-3">
                    <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-800" />
                    <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-800" />
                    <div className="h-2 w-full animate-pulse rounded-full bg-slate-800" />
                    <div className="h-2 w-5/6 animate-pulse rounded-full bg-slate-800" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && <div className="mt-5 rounded-xl border border-amber-900/50 bg-amber-500/10 p-4 text-sm text-amber-200">{error}{error.includes('Không thể tra cứu') && <button type="button" onClick={(event) => handleSearch(event, selectedFile || imageUrl)} className="ml-3 inline-flex items-center gap-1 rounded-md border border-amber-400/50 px-2 py-1 text-[11px] font-semibold text-amber-200 transition hover:bg-amber-500/10"><RefreshCw size={12} /> Thử lại</button>}</div>}
          {results.length > 0 && <div className="mt-7 space-y-4"><div className="flex items-end justify-between gap-3 border-b border-slate-800 pb-3"><div><h3 className="font-display text-base font-bold text-slate-100">Kết quả nhận diện</h3><p className="mt-1 text-xs text-slate-500">Kết quả đầu tiên thường là lựa chọn chính xác nhất.</p></div><span className="shrink-0 font-mono text-xs text-slate-500">{results.length} kết quả</span></div>{results.map((result, index) => <ResultCard key={`${result.anilist?.id || result.filename}-${result.episode}-${index}`} result={result} index={index} />)}</div>}
        </div>
      </article>
    </div>
  );
}

AnimeTraceTool.tool = { id: 'anime-frame-finder', Component: AnimeTraceTool };
export default AnimeTraceTool;
