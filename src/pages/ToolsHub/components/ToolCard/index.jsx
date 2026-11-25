import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, Lock, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { ToolEmblem } from '@/components/studio/StudioPrimitives';

function readSavedVocabCount() {
  if (typeof window === 'undefined') return { boards: 1, words: 0 };
  try {
    const raw = JSON.parse(window.localStorage.getItem('windhub-vocabulary-practice') || 'null');
    if (raw && Array.isArray(raw.boards)) {
      const words = raw.boards.reduce(
        (acc, b) => acc + (Array.isArray(b.words) ? b.words.length : 0),
        0
      );
      return { boards: raw.boards.length, words };
    }
  } catch {
    // Ignore read error
  }
  return { boards: 1, words: 0 };
}

function CasioVisualStage() {
  return (
    <span className="relative flex h-44 w-full flex-col justify-between overflow-hidden rounded-[var(--radius-md)] border border-slate-800/80 bg-[#0d1118] p-3.5 text-left select-none">
      <span className="flex items-center justify-between font-mono text-[10px] text-slate-400">
        <span className="font-extrabold tracking-[0.18em] text-white">CASIO · fx-580VN X</span>
        <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-bold text-sky-300 border border-sky-400/20">
          RAM 0xEA30
        </span>
      </span>

      {/* Authentic ClassWiz Dot-Matrix LCD */}
      <span className="relative my-1.5 flex flex-col justify-between rounded-lg border-2 border-[#323946] bg-[#c7d5c6] px-3 py-2.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.28)]">
        <span className="flex items-center justify-between font-mono text-[8px] font-bold text-[#1f2b21]/80">
          <span>M · D · Math▲</span>
          <span>VAR: A, B, C</span>
        </span>
        <span className="my-1.5 block text-center font-mono text-lg font-black tracking-[0.18em] text-[#111913] transition-transform duration-300 group-hover:scale-[1.03]">
          PASS KỲ THI
        </span>
        <span className="flex items-center justify-between font-mono text-[8px] text-[#28362a]/75">
          <span>HEX: F4 1E · 17 CHARS</span>
          <span>100% READY</span>
        </span>
      </span>

      <span className="flex items-center justify-between font-mono text-[9px] font-bold tracking-wider">
        <span className="flex items-center gap-2.5">
          <span className="text-amber-400">SHIFT</span>
          <span className="text-rose-400">ALPHA</span>
          <span className="text-sky-400">OPTN</span>
        </span>
        <span className="text-slate-400">CLASSWIZ ENGINE</span>
      </span>
    </span>
  );
}

function AsciiVisualStage() {
  return (
    <span className="relative grid h-44 w-full grid-cols-[0.88fr_1.12fr] overflow-hidden rounded-[var(--radius-md)] border border-slate-800/80 bg-[#0b0e14] select-none">
      {/* Left: Source Tonal Raster */}
      <span className="relative flex flex-col justify-between overflow-hidden border-r border-dashed border-white/15 bg-gradient-to-b from-[#172c48] via-[#d97742] to-[#f4c686] p-3">
        <span className="relative z-10 self-start rounded bg-black/55 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
          RASTER IN
        </span>
        <span className="pointer-events-none absolute right-4 top-8 size-7 rounded-full bg-amber-100 shadow-[0_0_20px_rgba(255,228,168,0.85)] transition-transform duration-500 group-hover:scale-110" />
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[56%] bg-[#1a2636]"
          style={{ clipPath: 'polygon(0 58%, 32% 14%, 62% 66%, 82% 30%, 100% 62%, 100% 100%, 0 100%)' }}
        />
        <span className="relative z-10 font-mono text-[8px] font-semibold text-amber-100/90">
          PNG · WEBP · 20MB
        </span>
      </span>

      {/* Right: Rendered Monospace Glyph Matrix */}
      <span className="flex flex-col justify-between bg-[#090c11] p-3 text-left">
        <span className="flex items-center justify-between font-mono text-[8px] font-bold uppercase tracking-wider text-slate-400">
          <span className="text-orange-400">GLYPH OUT</span>
          <span>100 COLS</span>
        </span>
        <span className="my-auto block overflow-hidden font-mono text-[8px] leading-[1.24] tracking-[0.08em] text-orange-300/95 transition-transform duration-300 group-hover:translate-x-0.5">
          <span className="block whitespace-pre">
            {'··░░▒▒▓▓██▓▓▒░·\n'}
            {'·░▒▓▓███████▓▒░\n'}
            {'░▒▓████▓▓████▓▒\n'}
            {'▒▓███▓▒░░▒▓███▓\n'}
            {'▓████▒····▒████\n'}
            {'██████▓▓▓▓█████'}
          </span>
        </span>
        <span className="flex items-center justify-between font-mono text-[8px] text-slate-500">
          <span>BRAILLE · DITHER</span>
          <span className="text-emerald-400">WORKER</span>
        </span>
      </span>
    </span>
  );
}

function VocabVisualStage({ stats }) {
  return (
    <span className="relative flex h-44 w-full flex-col justify-between overflow-hidden rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] p-3.5 text-left select-none">
      <span className="flex items-center justify-between font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
        <span className="text-[var(--os-success)]">VIỆT → ANH · RECALL</span>
        <span>
          {stats.words > 0 ? `${stats.words} TỪ · ${stats.boards} BẢNG` : '3 LƯỢT GỢI NHỚ'}
        </span>
      </span>

      <span className="my-auto space-y-2">
        <span className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-1)] px-3 py-2 shadow-2xs">
          <span className="min-w-0">
            <span className="block font-mono text-[8px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
              Từ mục tiêu
            </span>
            <span className="block truncate text-sm font-extrabold text-[var(--os-text-primary)]">
              chu đáo, ân cần
            </span>
          </span>
          <span className="rounded-md bg-[var(--os-success-soft)] px-2 py-0.5 font-mono text-[9px] font-bold text-[var(--os-success)] border border-[var(--os-success-border)]">
            Chuỗi +5
          </span>
        </span>

        <span className="grid grid-cols-2 gap-2">
          <span className="flex items-center justify-between rounded-[var(--radius-xs)] border border-[var(--os-success-border)] bg-[var(--os-success-soft)] px-2.5 py-1.5 text-xs font-bold text-[var(--os-success)] transition-transform duration-300 group-hover:scale-[1.02]">
            <span className="truncate">thoughtful</span>
            <Check size={13} className="shrink-0" />
          </span>
          <span className="flex items-center rounded-[var(--radius-xs)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-1)] px-2.5 py-1.5 text-xs font-medium text-[var(--os-text-muted)]">
            <span className="truncate">considerate</span>
          </span>
        </span>
      </span>

      <span className="block h-1 w-full overflow-hidden rounded-full bg-[var(--os-surface-3)]">
        <span className="block h-full w-3/4 rounded-full bg-[var(--os-success)]" />
      </span>
    </span>
  );
}

const ACCENT_MAP = {
  sky: {
    emblem: 'border-[var(--os-info-border)] bg-[var(--os-info-soft)] text-[var(--os-info)]',
    hoverBorder: 'hover:border-[var(--os-info-border)]',
  },
  orange: {
    emblem: 'border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]',
    hoverBorder: 'hover:border-[var(--os-accent-border)]',
  },
  emerald: {
    emblem: 'border-[var(--os-success-border)] bg-[var(--os-success-soft)] text-[var(--os-success)]',
    hoverBorder: 'hover:border-[var(--os-success-border)]',
  },
};

export default function ToolCard({ tool, onOpen, onShare }) {
  const [shake, setShake] = useState(false);
  const vocabStats = useMemo(
    () => (tool.id === 'VocabularyPractice' ? readSavedVocabCount() : null),
    [tool.id]
  );

  const tone = ACCENT_MAP[tool.accent] || ACCENT_MAP.orange;

  const handleClick = () => {
    if (tool.isLocked) {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      toast.warning(tool.lockReason || 'Công cụ này hiện đang khóa.');
      return;
    }
    onOpen();
  };

  return (
    <motion.article
      role="button"
      tabIndex={0}
      animate={shake ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Mở ${tool.title}`}
      className={`os-card os-focus-ring group relative flex h-full flex-col justify-between p-4 sm:p-5 text-left transition-all duration-200 ${
        tool.isLocked
          ? 'cursor-not-allowed opacity-80'
          : `cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--os-shadow-md)] ${tone.hoverBorder}`
      }`}
    >
      {/* Top Identity Row */}
      <div>
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`flex size-9.5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-2 ${tone.emblem}`}
            >
              <ToolEmblem variant={tool.emblem} size={19} />
            </span>
            <div className="min-w-0">
              <span className="block truncate font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--os-text-muted)]">
                {tool.categoryLabel}
              </span>
              <span className="block truncate text-[11px] font-medium text-[var(--os-text-secondary)]">
                {tool.runtimeNote}
              </span>
            </div>
          </div>

          {tool.badge && (
            <span className="shrink-0 rounded-md border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] px-2 py-1 font-mono text-[10px] font-bold text-[var(--os-text-secondary)]">
              {tool.badge}
            </span>
          )}
        </div>

        {/* Custom Visual Stage per Tool */}
        {tool.id === 'Casio580Spell' ? (
          <CasioVisualStage />
        ) : tool.id === 'ImageArtStudio' ? (
          <AsciiVisualStage />
        ) : (
          <VocabVisualStage stats={vocabStats || { boards: 1, words: 0 }} />
        )}

        {/* Title & Concise Commercial Copy */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base sm:text-lg font-extrabold tracking-tight text-[var(--os-text-primary)] group-hover:text-[var(--os-accent)] transition-colors">
              {tool.title}
            </h2>
            {tool.isLocked && <Lock size={14} className="shrink-0 text-[var(--os-warning)]" />}
          </div>
          <p className="mt-1.5 line-clamp-2 text-xs sm:text-[13px] leading-relaxed text-[var(--os-text-secondary)]">
            {tool.subtitle}
          </p>
        </div>
      </div>

      {/* Bottom Capabilities & Explicit CTA */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--os-border-subtle)] pt-3.5">
        <div className="min-w-0 flex-1 truncate font-mono text-[11px] text-[var(--os-text-muted)]">
          {(tool.tags || []).map((t) => t.trim()).join(' · ')}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {onShare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShare(tool);
              }}
              title="Chia sẻ liên kết công cụ"
              aria-label={`Chia sẻ ${tool.title}`}
              className="os-focus-ring flex size-8.5 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] text-[var(--os-text-secondary)] hover:border-[var(--os-border-strong)] hover:text-[var(--os-text-primary)] cursor-pointer transition-colors"
            >
              <Share2 size={14} />
            </button>
          )}

          <span className="inline-flex h-8.5 items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--os-accent)] px-3 text-xs font-bold text-[var(--os-accent-fg)] shadow-2xs transition-colors group-hover:bg-[var(--os-accent-hover)]">
            <span>{tool.isLocked ? 'Đang khóa' : 'Mở công cụ'}</span>
            {!tool.isLocked && (
              <ArrowUpRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            )}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
