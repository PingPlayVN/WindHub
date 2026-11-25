import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  Blocks,
  BookOpenCheck,
  Clock3,
  Cpu,
  Layers,
  ScanText,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState } from '@/components/os';
import { StudioSegmentedBar, ToolEmblem } from '@/components/studio/StudioPrimitives';
import useRecentTools, { formatRelativeVisit, trackRecentToolOpen } from '@/hooks/useRecentTools';
import {
  pageTransitionVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/design-system/motion';
import ToolCard from './components/ToolCard';
import ToolDialog from './components/ToolDialog';
import ToolShareDialog from './components/ToolShareDialog';
import { toolEntries } from './toolRegistry';

const CATEGORY_DEFS = [
  { id: 'all', label: 'Tất cả công cụ', icon: Layers },
  { id: 'hardware', label: 'Kỹ thuật & Máy tính', icon: Cpu },
  { id: 'graphics', label: 'Đồ họa & Ký tự', icon: ScanText },
  { id: 'language', label: 'Học tập & Ngôn ngữ', icon: BookOpenCheck },
];

export default function ToolsHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sharingTool, setSharingTool] = useState(null);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const { recentItems, clearRecent } = useRecentTools('tool');

  const toolParam = searchParams.get('toolId') || searchParams.get('tool') || '';

  const selectedTool = useMemo(() => {
    if (!toolParam) return null;
    const matched = toolEntries.find(
      (t) => t.id.toLowerCase() === toolParam.toLowerCase()
    );
    if (!matched || matched.isLocked) return null;
    return matched;
  }, [toolParam]);

  useEffect(() => {
    if (!toolParam) return;
    const matched = toolEntries.find(
      (t) => t.id.toLowerCase() === toolParam.toLowerCase()
    );
    if (!matched) {
      toast.error(`Không tìm thấy công cụ "${toolParam}"`);
    } else if (matched.isLocked) {
      toast.warning(matched.lockReason || 'Công cụ này hiện đang khóa.');
    } else {
      trackRecentToolOpen(matched.id, 'tool');
    }
  }, [toolParam]);

  // Press '/' to focus tool search when not typing in an input
  useEffect(() => {
    const onKeyDown = (e) => {
      if (
        e.key === '/' &&
        !selectedTool &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedTool]);

  const handleOpenTool = (tool) => {
    if (tool?.isDirectLink && tool?.link) {
      navigate(tool.link);
      return;
    }
    if (tool.isLocked) {
      toast.warning(tool.lockReason || 'Công cụ này hiện đang khóa.');
      return;
    }
    trackRecentToolOpen(tool.id, 'tool');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('toolId', tool.id);
    setSearchParams(nextParams);
  };

  const handleCloseTool = () => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextParams.has('toolId') || nextParams.has('tool')) {
      nextParams.delete('toolId');
      nextParams.delete('tool');
      setSearchParams(nextParams);
    }
  };

  const categoriesWithCount = useMemo(
    () =>
      CATEGORY_DEFS.map((cat) => ({
        ...cat,
        count:
          cat.id === 'all'
            ? toolEntries.length
            : toolEntries.filter((t) => t.category === cat.id).length,
      })),
    []
  );

  const recentToolsResolved = useMemo(
    () =>
      recentItems
        .map((rec) => {
          const found = toolEntries.find((t) => t.id === rec.id);
          return found ? { ...found, lastOpenedAt: rec.lastOpenedAt } : null;
        })
        .filter(Boolean)
        .slice(0, 3),
    [recentItems]
  );

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return toolEntries.filter((tool) => {
      const matchesCat = category === 'all' || tool.category === category;
      const matchesQuery =
        !q ||
        tool.title.toLowerCase().includes(q) ||
        (tool.subtitle || '').toLowerCase().includes(q) ||
        (tool.categoryLabel || '').toLowerCase().includes(q) ||
        (tool.tags || []).some((tag) => tag.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [category, searchQuery]);

  const activeCategoryCount = useMemo(
    () => new Set(toolEntries.map((t) => t.category)).size,
    []
  );

  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6 pb-10"
    >
      {/* 1. COMMERCIAL STUDIO HERO SECTION */}
      <section className="os-card relative overflow-hidden rounded-[var(--radius-2xl)] p-5 sm:p-7 lg:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[var(--os-accent-soft)] opacity-60 blur-3xl"
        />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          {/* Left: Editorial Heading + Prominent Search */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--os-accent)]">
              <span className="size-1.5 rounded-full bg-[var(--os-accent)]" />
              <span>WINDOS // WORKBENCH SUITE</span>
            </div>

            <div>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--os-text-primary)]">
                Hệ sinh thái Công cụ
              </h1>
              <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-[var(--os-text-secondary)]">
                Bộ ứng dụng chuyên sâu xử lý hoàn toàn trên thiết bị của bạn — từ biên dịch tràn bộ nhớ máy tính kỹ thuật, chuyển đổi nghệ thuật ký tự cục bộ đến luyện phản xạ ngôn ngữ.
              </p>
            </div>

            {/* Prominent Instant Search Bar */}
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
                placeholder="Tìm kiếm công cụ theo tên, tính năng (Casio, Hex, ASCII, Braille, Từ vựng)..."
                aria-label="Tìm kiếm công cụ"
                className="os-focus-ring h-11.5 w-full rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] pl-10 pr-20 text-xs sm:text-sm font-medium text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] transition-colors focus:border-[var(--os-accent)] focus:bg-[var(--os-surface-1)]"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Xóa từ khóa tìm kiếm"
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

          {/* Right: Clean Structural Stats + Extensions Cross-Navigation */}
          <div className="flex flex-col justify-between gap-4 lg:items-end">
            <Link
              to="/extensions"
              className="os-focus-ring group inline-flex self-start lg:self-end items-center gap-2 rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3.5 py-2 text-xs font-bold text-[var(--os-text-primary)] hover:border-[var(--os-accent-border)] hover:text-[var(--os-accent)] transition-colors"
            >
              <Blocks size={14} className="text-[var(--os-accent)]" />
              <span>Chuyển sang Tiện ích mở rộng</span>
              <ArrowUpRight
                size={14}
                className="text-[var(--os-text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--os-accent)]"
              />
            </Link>

            <div className="grid w-full grid-cols-3 divide-x divide-[var(--os-border-subtle)] rounded-[var(--radius-lg)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)]/70 py-3">
              <div className="px-3 sm:px-4">
                <p className="font-mono text-lg sm:text-xl font-extrabold tabular-nums text-[var(--os-text-primary)]">
                  {String(toolEntries.length).padStart(2, '0')}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-[var(--os-text-muted)]">
                  Công cụ sẵn có
                </p>
              </div>
              <div className="px-3 sm:px-4">
                <p className="font-mono text-lg sm:text-xl font-extrabold tabular-nums text-[var(--os-text-primary)]">
                  {String(activeCategoryCount).padStart(2, '0')}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-[var(--os-text-muted)]">
                  Nhóm chuyên môn
                </p>
              </div>
              <div className="px-3 sm:px-4">
                <p className="font-mono text-lg sm:text-xl font-extrabold tabular-nums text-[var(--os-success)]">
                  100%
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-[var(--os-text-muted)]">
                  Xử lý cục bộ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Used Strip (Real User History Only) */}
        <AnimatePresence initial={false}>
          {recentToolsResolved.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative z-10 mt-5 overflow-hidden border-t border-[var(--os-border-subtle)] pt-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 pr-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
                    <Clock3 size={13} className="text-[var(--os-accent)]" />
                    <span>Mở gần đây</span>
                  </span>

                  {recentToolsResolved.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleOpenTool(item)}
                      className="os-focus-ring group inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3 py-1.5 text-left text-xs cursor-pointer transition-colors hover:border-[var(--os-accent-border)] hover:bg-[var(--os-surface-1)]"
                    >
                      <ToolEmblem
                        variant={item.emblem}
                        size={14}
                        className="text-[var(--os-accent)] transition-transform group-hover:scale-110"
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
                  className="os-focus-ring inline-flex items-center gap-1 rounded-[var(--radius-xs)] px-2 py-1 text-[11px] font-medium text-[var(--os-text-muted)] hover:text-[var(--os-danger)] cursor-pointer transition-colors"
                >
                  <Trash2 size={12} />
                  <span>Xóa lịch sử</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 2. CATEGORY NAVIGATION BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="overflow-x-auto no-scrollbar pb-0.5">
          <StudioSegmentedBar
            items={categoriesWithCount}
            activeId={category}
            onSelect={setCategory}
            layoutId="tools-hub-category-pill"
            ariaLabel="Danh mục công cụ"
          />
        </div>

        <p className="font-mono text-xs text-[var(--os-text-muted)] px-1">
          Hiển thị <strong className="text-[var(--os-text-primary)]">{filteredTools.length}</strong> / {toolEntries.length} công cụ
        </p>
      </div>

      {/* 3. BENTO TOOL CARDS GRID */}
      {filteredTools.length > 0 ? (
        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredTools.map((tool, index) => (
            <motion.div key={tool.id} variants={staggerItemVariants} layout>
              <ToolCard
                tool={tool}
                index={index}
                onOpen={() => handleOpenTool(tool)}
                onShare={(t) => setSharingTool(t)}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="os-card rounded-[var(--radius-xl)] p-8">
          <EmptyState
            icon={<Search size={24} />}
            title="Không tìm thấy công cụ phù hợp"
            description={`Không có công cụ nào khớp với từ khóa "${searchQuery}" trong danh mục đang chọn.`}
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

      {selectedTool && (
        <ToolDialog
          tool={selectedTool}
          onClose={handleCloseTool}
          onShare={(t) => setSharingTool(t)}
        />
      )}

      {sharingTool && (
        <ToolShareDialog
          tool={sharingTool}
          onClose={() => setSharingTool(null)}
        />
      )}
    </motion.div>
  );
}
