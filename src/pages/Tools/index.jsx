import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  Layers,
  Maximize2,
  Minimize2,
  Radar,
  ScanEye,
  Search,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState, IconButton, LoadingState } from '@/components/os';
import { StudioSegmentedBar, ToolEmblem } from '@/components/studio/StudioPrimitives';
import useRecentTools, { formatRelativeVisit, trackRecentToolOpen } from '@/hooks/useRecentTools';
import {
  modalBackdropVariants,
  modalPanelVariants,
  pageTransitionVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/design-system/motion';

const extensionModules = import.meta.glob('../../modules/Extension/*/index.jsx');

const EXTENSION_CATALOG = {
  FacebookProfileTool: {
    id: 'facebook-profile',
    folderId: 'FacebookProfileTool',
    title: 'Facebook Public Analyzer v4.1',
    subtitle:
      'Bóc tách đa luồng mọi định dạng URL Facebook (Profile, Group, Page, Watch, Reel, Story), trích xuất UID và sinh liên kết chuẩn hóa không dùng Cookie.',
    category: 'osint',
    categoryLabel: 'Phân tích OSINT & URL',
    emblem: 'fb-osint',
    accent: 'sky',
    statusBadge: '100% Client-Side',
    protocolNote: 'Zero-Cookie · Local Parser',
    tags: ['Trích xuất UID', 'MBasic / Canonical', 'Xuất JSON'],
  },
  AnimeTraceTool: {
    id: 'anime-frame-finder',
    folderId: 'AnimeTraceTool',
    title: 'Anime Frame Finder',
    subtitle:
      'Đối chiếu thị giác khung hình anime qua cơ sở dữ liệu trace.moe & AniList để tìm chính xác tên phim, số tập và mốc thời gian xuất hiện.',
    category: 'vision',
    categoryLabel: 'Nhận diện Thị giác',
    emblem: 'anime-trace',
    accent: 'violet',
    statusBadge: 'trace.moe API',
    protocolNote: 'HTTPS · Clipboard Ctrl+V',
    tags: ['Image & URL', 'Mốc thời gian', 'Trích đoạn Video'],
  },
};

const extensionEntries = Object.entries(extensionModules)
  .map(([path, importer]) => {
    const folderId = path.split('/').slice(-2, -1)[0];
    const meta = EXTENSION_CATALOG[folderId] || {
      id: folderId.toLowerCase(),
      folderId,
      title: folderId,
      subtitle: 'Tiện ích mở rộng chuyên biệt trên WindHub.',
      category: 'osint',
      categoryLabel: 'Tiện ích mở rộng',
      emblem: 'fb-osint',
      accent: 'sky',
      statusBadge: 'Ready',
      protocolNote: 'Client Module',
      tags: ['Extension'],
    };
    return {
      ...meta,
      Component: lazy(async () => {
        const module = await importer();
        return { default: module.default?.tool?.Component || module.default };
      }),
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

const CATEGORY_DEFS = [
  { id: 'all', label: 'Tất cả tiện ích', icon: Layers },
  { id: 'osint', label: 'Phân tích OSINT & URL', icon: Radar },
  { id: 'vision', label: 'Nhận diện Thị giác', icon: ScanEye },
];

function FbOsintPreviewStage() {
  return (
    <div className="flex h-40 w-full flex-col justify-between overflow-hidden rounded-[var(--radius-md)] border border-slate-800/80 bg-[#0b1018] p-3.5 font-mono text-xs select-none">
      <div className="flex items-center justify-between text-[9px] text-slate-400">
        <span className="font-bold text-sky-400">INPUT // FACEBOOK URL</span>
        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-bold text-emerald-300">
          NO COOKIE
        </span>
      </div>

      <div className="rounded-md border border-slate-800 bg-[#111826] px-2.5 py-1.5 text-[10px] text-slate-300 truncate">
        https://www.facebook.com/profile.php?id=1000...
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-[9px]">
        <div className="rounded border border-sky-500/25 bg-sky-500/10 px-2 py-1.5">
          <span className="block text-slate-400">TYPE</span>
          <strong className="text-sky-300">Profile</strong>
        </div>
        <div className="rounded border border-slate-800 bg-[#111826] px-2 py-1.5">
          <span className="block text-slate-400">LINKS</span>
          <strong className="text-white">5 Variants</strong>
        </div>
        <div className="rounded border border-slate-800 bg-[#111826] px-2 py-1.5">
          <span className="block text-slate-400">EXPORT</span>
          <strong className="text-emerald-300">JSON v4.1</strong>
        </div>
      </div>
    </div>
  );
}

function AnimeVisionPreviewStage() {
  return (
    <div className="relative flex h-40 w-full flex-col justify-between overflow-hidden rounded-[var(--radius-md)] border border-slate-800/80 bg-gradient-to-br from-[#131024] via-[#0d101b] to-[#090b12] p-3.5 font-mono text-xs select-none">
      <div className="flex items-center justify-between text-[9px]">
        <span className="font-bold uppercase tracking-wider text-violet-300">
          FRAME SCAN // TRACE.MOE
        </span>
        <span className="rounded bg-violet-500/20 px-1.5 py-0.5 font-bold text-violet-200 border border-violet-400/25">
          97% MATCH
        </span>
      </div>

      <div className="my-auto flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
        <div className="min-w-0">
          <span className="block text-[8px] uppercase tracking-wider text-slate-400">
            SCENE TIMESTAMP
          </span>
          <strong className="mt-0.5 block truncate font-sans text-xs font-bold text-white">
            Episode 12 · 14:28 – 14:34
          </strong>
        </div>
        <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-1 text-[9px] font-bold text-emerald-300">
          AniList Linked
        </span>
      </div>

      <div className="flex items-center justify-between text-[9px] text-slate-400">
        <span>CTRL+V CLIPBOARD</span>
        <span>PNG · JPG · URL</span>
      </div>
    </div>
  );
}

function ExtensionCard({ ext, onOpen, onShare }) {
  const isVision = ext.category === 'vision';

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(ext)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault();
          onOpen(ext);
        }
      }}
      aria-label={`Mở tiện ích ${ext.title}`}
      className="os-card os-focus-ring group flex h-full flex-col justify-between p-5 text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--os-accent-border)] hover:shadow-[var(--os-shadow-md)]"
    >
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border transition-transform duration-200 group-hover:scale-105 ${
                isVision
                  ? 'border-violet-500/30 bg-violet-500/12 text-violet-600 dark:text-violet-300'
                  : 'border-[var(--os-info-border)] bg-[var(--os-info-soft)] text-[var(--os-info)]'
              }`}
            >
              <ToolEmblem variant={ext.emblem} size={20} />
            </span>
            <div className="min-w-0">
              <span className="block truncate font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--os-text-muted)]">
                {ext.categoryLabel}
              </span>
              <span className="block truncate text-[11px] font-medium text-[var(--os-text-secondary)]">
                {ext.protocolNote}
              </span>
            </div>
          </div>

          <span className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-[var(--os-success-border)] bg-[var(--os-success-soft)] px-2 py-1 font-mono text-[10px] font-bold text-[var(--os-success)]">
            <span className="size-1.5 rounded-full bg-[var(--os-success)]" />
            {ext.statusBadge}
          </span>
        </div>

        {ext.id === 'anime-frame-finder' ? (
          <AnimeVisionPreviewStage />
        ) : (
          <FbOsintPreviewStage />
        )}

        <div className="mt-4">
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--os-text-primary)] group-hover:text-[var(--os-accent)] transition-colors">
            {ext.title}
          </h2>
          <p className="mt-1.5 line-clamp-2 text-xs sm:text-[13px] leading-relaxed text-[var(--os-text-secondary)]">
            {ext.subtitle}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--os-border-subtle)] pt-3.5">
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[var(--os-text-muted)]">
          {ext.tags.join(' · ')}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare(ext);
            }}
            title="Sao chép liên kết tiện ích"
            aria-label={`Chia sẻ ${ext.title}`}
            className="os-focus-ring flex size-8.5 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] text-[var(--os-text-secondary)] hover:border-[var(--os-border-strong)] hover:text-[var(--os-text-primary)] cursor-pointer transition-colors"
          >
            <Share2 size={14} />
          </button>

          <span className="inline-flex h-8.5 items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--os-accent)] px-3 text-xs font-bold text-[var(--os-accent-fg)] transition-colors group-hover:bg-[var(--os-accent-hover)]">
            <span>Khởi chạy</span>
            <ArrowUpRight
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </div>
      </div>
    </article>
  );
}

function ExtensionDialog({ extension, onClose, onShare }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!extension) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [extension, onClose]);

  if (!extension || typeof document === 'undefined') return null;
  const ExtComponent = extension.Component;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.button
          type="button"
          aria-label="Đóng tiện ích"
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 border-0 cursor-default bg-[var(--os-backdrop)] backdrop-blur-xs"
        />

        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="ext-dialog-title"
          variants={modalPanelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`os-floating-surface relative z-10 flex flex-col overflow-hidden text-[var(--os-text-primary)] transition-[max-width,height] duration-200 ${
            expanded
              ? 'h-[96dvh] w-full max-w-[97vw] rounded-[var(--radius-xl)]'
              : 'max-h-[94dvh] sm:max-h-[90vh] w-full max-w-5xl rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)]'
          }`}
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--os-border-subtle)] bg-[var(--os-surface-1)]/95 px-4 sm:px-5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8.5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
                <ToolEmblem variant={extension.emblem} size={17} />
              </span>
              <div className="min-w-0">
                <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--os-text-muted)]">
                  {extension.categoryLabel} · {extension.statusBadge}
                </span>
                <h2
                  id="ext-dialog-title"
                  className="truncate text-sm sm:text-base font-bold text-[var(--os-text-primary)]"
                >
                  {extension.title}
                </h2>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <IconButton
                label="Sao chép liên kết tiện ích"
                size="sm"
                variant="subtle"
                onClick={() => onShare(extension)}
              >
                <Share2 size={15} />
              </IconButton>
              <IconButton
                label={expanded ? 'Thu nhỏ cửa sổ' : 'Phóng to cửa sổ'}
                size="sm"
                variant="subtle"
                onClick={() => setExpanded((v) => !v)}
                className="hidden sm:inline-flex"
              >
                {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </IconButton>
              <IconButton label="Đóng tiện ích (Esc)" size="sm" variant="subtle" onClick={onClose}>
                <X size={17} />
              </IconButton>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar bg-[var(--os-bg)] p-4 sm:p-6 text-[var(--os-text-primary)]">
            <Suspense fallback={<LoadingState label={`Đang mở ${extension.title}...`} />}>
              <ExtComponent embedded />
            </Suspense>
          </div>
        </motion.section>
      </div>
    </AnimatePresence>,
    document.body
  );
}

export default function Tools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const { recentItems, clearRecent } = useRecentTools('extension');

  const extParam = searchParams.get('ext') || '';

  const activeExtension = useMemo(() => {
    if (!extParam) return null;
    return (
      extensionEntries.find(
        (e) =>
          e.id.toLowerCase() === extParam.toLowerCase() ||
          e.folderId.toLowerCase() === extParam.toLowerCase()
      ) || null
    );
  }, [extParam]);

  useEffect(() => {
    if (activeExtension) {
      trackRecentToolOpen(activeExtension.id, 'extension');
    }
  }, [activeExtension]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (
        e.key === '/' &&
        !activeExtension &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeExtension]);

  const handleOpenExtension = (ext) => {
    trackRecentToolOpen(ext.id, 'extension');
    const next = new URLSearchParams(searchParams);
    next.set('ext', ext.id);
    setSearchParams(next);
  };

  const handleCloseExtension = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('ext');
    setSearchParams(next);
  };

  const handleShareExtension = async (ext) => {
    const shareUrl = `${window.location.origin}/extensions?ext=${encodeURIComponent(ext.id)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(`Đã sao chép liên kết đến ${ext.title}`);
    } catch {
      toast.error('Không thể sao chép liên kết');
    }
  };

  const categoriesWithCount = useMemo(
    () =>
      CATEGORY_DEFS.map((cat) => ({
        ...cat,
        count:
          cat.id === 'all'
            ? extensionEntries.length
            : extensionEntries.filter((e) => e.category === cat.id).length,
      })),
    []
  );

  const recentExtensionsResolved = useMemo(
    () =>
      recentItems
        .map((rec) => {
          const found = extensionEntries.find((e) => e.id === rec.id);
          return found ? { ...found, lastOpenedAt: rec.lastOpenedAt } : null;
        })
        .filter(Boolean)
        .slice(0, 3),
    [recentItems]
  );

  const filteredExtensions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return extensionEntries.filter((ext) => {
      const matchesCat = category === 'all' || ext.category === category;
      const matchesQuery =
        !q ||
        ext.title.toLowerCase().includes(q) ||
        ext.subtitle.toLowerCase().includes(q) ||
        ext.categoryLabel.toLowerCase().includes(q) ||
        ext.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [category, searchQuery]);

  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6 pb-10"
    >
      {/* 1. EXTENSIONS HUB HERO */}
      <section className="os-card relative overflow-hidden rounded-[var(--radius-2xl)] p-5 sm:p-7 lg:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[var(--os-info-soft)] opacity-60 blur-3xl"
        />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--os-info)]">
              <span className="size-1.5 rounded-full bg-[var(--os-info)]" />
              <span>WINDOS // EXTENSIONS LAB</span>
            </div>

            <div>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--os-text-primary)]">
                Tiện ích Mở rộng
              </h1>
              <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-[var(--os-text-secondary)]">
                Không gian chuyên biệt cho các mô-đun phân tích tín hiệu URL mạng xã hội (OSINT) và tra cứu ngược khung hình thị giác — tách biệt rõ ràng với bộ công cụ xử lý nội bộ.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative max-w-xl pt-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 mt-0.5 text-[var(--os-text-muted)]"
              />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tiện ích theo tên, giao thức (Facebook, UID, OSINT, Anime, trace.moe)..."
                aria-label="Tìm kiếm tiện ích mở rộng"
                className="os-focus-ring h-11.5 w-full rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] pl-10 pr-20 text-xs sm:text-sm font-medium text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] transition-colors focus:border-[var(--os-accent)] focus:bg-[var(--os-surface-1)]"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Xóa từ khóa"
                  className="os-focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 mt-0.5 inline-flex items-center gap-1 rounded-[var(--radius-xs)] bg-[var(--os-surface-3)] px-2 py-1 text-[11px] font-semibold text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)] cursor-pointer"
                >
                  <X size={12} />
                  <span>Xóa</span>
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 hidden sm:inline-flex items-center rounded-[var(--radius-xs)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-1)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--os-text-muted)]">
                  Nhấn /
                </kbd>
              )}
            </div>
          </div>

          {/* Telemetry & Back to Tools */}
          <div className="flex flex-col justify-between gap-4 lg:items-end">
            <Link
              to="/tools"
              className="os-focus-ring inline-flex self-start lg:self-end items-center gap-2 rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3.5 py-2 text-xs font-bold text-[var(--os-text-primary)] hover:border-[var(--os-accent-border)] hover:text-[var(--os-accent)] transition-colors"
            >
              <ArrowLeft size={14} className="text-[var(--os-accent)]" />
              <span>Về Hệ sinh thái Công cụ</span>
            </Link>

            <div className="grid w-full grid-cols-3 divide-x divide-[var(--os-border-subtle)] rounded-[var(--radius-lg)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)]/70 py-3">
              <div className="px-3 sm:px-4">
                <p className="font-mono text-lg sm:text-xl font-extrabold tabular-nums text-[var(--os-text-primary)]">
                  {String(extensionEntries.length).padStart(2, '0')}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-[var(--os-text-muted)]">
                  Mô-đun hoạt động
                </p>
              </div>
              <div className="px-3 sm:px-4">
                <p className="font-mono text-lg sm:text-xl font-extrabold tabular-nums text-[var(--os-text-primary)]">
                  02
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-[var(--os-text-muted)]">
                  Nhóm tín hiệu
                </p>
              </div>
              <div className="px-3 sm:px-4">
                <p className="font-mono text-lg sm:text-xl font-extrabold tabular-nums text-[var(--os-success)]">
                  Zero
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-[var(--os-text-muted)]">
                  Cookie lưu trữ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Used Extensions */}
        <AnimatePresence initial={false}>
          {recentExtensionsResolved.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative z-10 mt-5 overflow-hidden border-t border-[var(--os-border-subtle)] pt-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 pr-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
                    <Clock3 size={13} className="text-[var(--os-info)]" />
                    <span>Vừa sử dụng</span>
                  </span>
                  {recentExtensionsResolved.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleOpenExtension(item)}
                      className="os-focus-ring inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs cursor-pointer transition-colors hover:border-[var(--os-accent-border)]"
                    >
                      <ToolEmblem
                        variant={item.emblem}
                        size={14}
                        className="text-[var(--os-info)]"
                      />
                      <span className="font-semibold text-[var(--os-text-primary)]">
                        {item.title}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--os-text-muted)]">
                        · {formatRelativeVisit(item.lastOpenedAt)}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={clearRecent}
                  className="inline-flex items-center gap-1 rounded-[var(--radius-xs)] px-2 py-1 text-[11px] font-medium text-[var(--os-text-muted)] hover:text-[var(--os-danger)] cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>Xóa lịch sử</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 2. CATEGORY BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="overflow-x-auto no-scrollbar pb-0.5">
          <StudioSegmentedBar
            items={categoriesWithCount}
            activeId={category}
            onSelect={setCategory}
            layoutId="extensions-hub-category-pill"
            ariaLabel="Danh mục tiện ích"
          />
        </div>

        <p className="font-mono text-xs text-[var(--os-text-muted)] px-1">
          Hiển thị <strong className="text-[var(--os-text-primary)]">{filteredExtensions.length}</strong> / {extensionEntries.length} tiện ích
        </p>
      </div>

      {/* 3. EXTENSIONS GRID */}
      {filteredExtensions.length > 0 ? (
        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-5 lg:grid-cols-2"
        >
          {filteredExtensions.map((ext) => (
            <motion.div key={ext.id} variants={staggerItemVariants} layout>
              <ExtensionCard
                ext={ext}
                onOpen={handleOpenExtension}
                onShare={handleShareExtension}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="os-card rounded-[var(--radius-xl)] p-8">
          <EmptyState
            icon={<Search size={24} />}
            title="Không tìm thấy tiện ích phù hợp"
            description={`Không có tiện ích nào khớp với từ khóa "${searchQuery}".`}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCategory('all');
                  setSearchQuery('');
                }}
              >
                Đặt lại bộ lọc
              </Button>
            }
          />
        </div>
      )}

      {activeExtension && (
        <ExtensionDialog
          extension={activeExtension}
          onClose={handleCloseExtension}
          onShare={handleShareExtension}
        />
      )}
    </motion.div>
  );
}
