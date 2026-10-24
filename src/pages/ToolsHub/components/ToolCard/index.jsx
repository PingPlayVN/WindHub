import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Calculator,
  Check,
  Languages,
  Sparkles,
  Lock,
  AlertCircle,
  Terminal,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Card Thumbnail cho Casio fx-580VN X
 * Thiết kế chuẩn xác mô phỏng mặt trước và màn hình LCD dot-matrix của máy tính Casio ClassWiz fx-580VN X
 */
function Casio580Thumbnail() {
  return (
    <span className="relative flex min-h-0 w-full flex-1 flex-col justify-between overflow-hidden rounded-md border border-slate-700/60 bg-[#14171c] p-2.5 sm:p-3 select-none">
      {/* Background carbon texture overlay */}
      <span
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(#475569 1px, transparent 1px), radial-gradient(#475569 1px, #14171c 1px)`,
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 4px 4px',
        }}
      />

      {/* Top Header Plate (CASIO + Solar Cell + fx-580VN X ClassWiz) */}
      <span className="relative z-10 flex items-center justify-between pb-1.5 border-b border-slate-700/40">
        <span className="flex items-center gap-2">
          <span className="font-sans font-black text-xs sm:text-sm tracking-[0.18em] text-slate-100">
            CASIO
          </span>
          {/* Photovoltaic Solar Cell (4 segments) */}
          <span className="hidden xs:flex items-center gap-[1.5px] px-1.5 py-0.5 rounded bg-[#1e130c] border border-amber-900/50 shadow-inner">
            <span className="w-1.5 h-3 bg-gradient-to-b from-amber-700/70 to-amber-950 rounded-[1px]" />
            <span className="w-1.5 h-3 bg-gradient-to-b from-amber-700/70 to-amber-950 rounded-[1px]" />
            <span className="w-1.5 h-3 bg-gradient-to-b from-amber-700/70 to-amber-950 rounded-[1px]" />
            <span className="w-1.5 h-3 bg-gradient-to-b from-amber-700/70 to-amber-950 rounded-[1px]" />
          </span>
        </span>

        <span className="flex items-center gap-1.5 font-mono text-[9px] text-right">
          <span className="font-bold italic text-slate-300 tracking-wider">fx-580VN X</span>
          <span className="text-[7.5px] font-bold tracking-widest uppercase text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded border border-amber-400/25">
            CLASSWIZ
          </span>
        </span>
      </span>

      {/* Realistic Casio LCD Dot-Matrix Screen */}
      <span className="relative z-10 my-1.5 flex flex-col justify-between rounded-lg border-2 border-slate-700/90 bg-[#0d1612] p-2 shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-300 group-hover:border-emerald-500/50">
        {/* Subtle LCD Dot Grid Layer */}
        <span
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(circle, #34d399 0.8px, transparent 0.8px)',
            backgroundSize: '4px 4px',
          }}
        />

        {/* Top LCD Status Indicators */}
        <span className="relative z-10 flex items-center justify-between font-mono text-[7px] font-bold tracking-wider text-emerald-500/80 pb-1 border-b border-emerald-900/30">
          <span className="flex items-center gap-1.5">
            <span className="px-1 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">S</span>
            <span className="px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">A</span>
            <span className="text-emerald-400/90">M</span>
            <span className="text-emerald-400/90">STO</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400/90">
            <span>LineI/O</span>
            <span>Math ▲▼</span>
          </span>
        </span>

        {/* Main LCD Matrix Content (The Hack Display Line) */}
        <span className="relative z-10 py-1 font-mono text-left">
          <span className="block text-[8px] text-emerald-400/60 leading-none">
            Basic Overflow (A-B-C)
          </span>
          <span className="block font-black text-xs sm:text-sm tracking-widest text-emerald-300 py-1 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] truncate">
            \\\\\\PASS\KỲ\THI\\\\<span className="animate-pulse text-emerald-200">▌</span>
          </span>
          <span className="flex items-center justify-between text-[7.5px] text-emerald-400/80 pt-0.5 border-t border-emerald-950">
            <span>hex: á=F471 · k=6B · í=F47D</span>
            <span className="text-amber-300/90 font-bold">17 Ký tự</span>
          </span>
        </span>
      </span>

      {/* Calculator Keypad Top Row (SHIFT, ALPHA, REPLAY D-PAD, MENU) */}
      <span className="relative z-10 flex items-center justify-between px-1 font-mono text-[8px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-amber-400 font-bold shadow-xs">
            SHIFT
          </span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-rose-400 font-bold shadow-xs">
            ALPHA
          </span>
        </span>

        {/* Circular REPLAY D-PAD */}
        <span className="relative grid place-items-center h-6 w-9 rounded-full bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border border-zinc-600 shadow-md text-[6.5px] text-zinc-300">
          <span className="flex items-center justify-between w-full px-1 text-[7px] font-bold">
            <span>◀</span>
            <span className="text-[6px] tracking-tighter text-slate-400">REPLAY</span>
            <span>▶</span>
          </span>
        </span>

        <span className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-slate-300 font-semibold shadow-xs">
            OPTN
          </span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-slate-300 font-semibold shadow-xs">
            MENU
          </span>
        </span>
      </span>
    </span>
  );
}

function ImageArtThumbnail() {
  return (
    <span className="relative flex min-h-0 w-full flex-1 flex-col justify-between overflow-hidden rounded-md border border-orange-300/30 bg-[#090d13] p-3 sm:p-4">
      <span className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-orange-400/20 blur-3xl transition-transform duration-700 group-hover:translate-x-2 group-hover:translate-y-4" />
      <span className="relative flex items-center justify-between font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        <span className="inline-flex items-center gap-1.5"><Sparkles size={12} className="text-orange-400" /> Image → text art</span>
        <span className="text-emerald-400">LOCAL · 100%</span>
      </span>

      <span className="relative grid min-h-0 flex-1 grid-cols-[0.8fr_1.2fr] items-center gap-3 py-3 transition-transform duration-500 group-hover:scale-[1.02]">
        <span className="relative mx-auto aspect-[4/3] w-full max-w-36 overflow-hidden rounded-lg border border-slate-700/80 bg-[linear-gradient(180deg,#243a58_0%,#ea986c_72%,#edbf83_100%)] shadow-lg">
          <span className="absolute right-[16%] top-[17%] h-7 w-7 rounded-full bg-amber-100 shadow-[0_0_22px_rgba(255,222,154,.75)] sm:h-9 sm:w-9" />
          <span className="absolute inset-x-0 bottom-0 h-[70%] bg-[#344a5a]" style={{ clipPath: 'polygon(0 70%, 28% 15%, 53% 73%, 70% 40%, 100% 100%, 0 100%)' }} />
          <span className="absolute inset-x-0 bottom-0 h-[48%] bg-[#111d2a]" style={{ clipPath: 'polygon(0 45%, 28% 0, 54% 70%, 76% 24%, 100% 58%, 100% 100%, 0 100%)' }} />
          <span className="absolute inset-x-0 bottom-0 h-[13%] bg-[#080d13]" />
          <span className="absolute left-2 top-2 rounded bg-black/35 px-1.5 py-0.5 font-mono text-[7px] tracking-wider text-white/85">ORIGINAL</span>
        </span>

        <span className="min-w-0 rounded-lg border border-slate-700/80 bg-[#0d131c]/90 p-2.5 shadow-lg sm:p-3">
          <span className="mb-2 flex items-center justify-between font-mono text-[7px] uppercase tracking-[0.13em] text-slate-500 sm:text-[8px]">
            <span>ASCII PREVIEW</span><span className="text-orange-300">80 × 32</span>
          </span>
          <span className="block overflow-hidden font-mono text-[7px] leading-[1.25] tracking-[0.12em] text-orange-300 sm:text-[8px]">
            <span className="block whitespace-pre">···········░░░·····<br />········░░▒▒▒▒▒░···<br />······▒▒▓▓██▓▓▒▒░··<br />····▒▒▓▓██████▓▓▒░·<br />░░▒▒▓▓██████████▓▒▒<br />▒▒▓▓██████▓▓██████▓<br />▓▓██████▓▓▓▓███████<br />██████▓▒░··░▒▓█████</span>
          </span>
        </span>
      </span>

      <span className="relative flex flex-wrap items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.08em] text-slate-400">
        <span className="rounded border border-orange-300/20 bg-orange-300/10 px-2 py-1 text-orange-200">ASCII</span>
        <span className="rounded border border-slate-700 bg-slate-800/70 px-2 py-1">Braille</span>
        <span className="rounded border border-slate-700 bg-slate-800/70 px-2 py-1">Blocks</span>
        <span className="rounded border border-slate-700 bg-slate-800/70 px-2 py-1">Dither</span>
        <span className="ml-auto inline-flex items-center gap-1 text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> NO UPLOAD</span>
      </span>
    </span>
  );
}

function DefaultToolThumbnail() {
  return (
    <span className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-md bg-[#f4f5f2] p-3 sm:p-4">
      <span className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-emerald-200/60 blur-2xl transition-transform duration-700 group-hover:translate-x-3 group-hover:translate-y-5" />
      <span className="relative z-10 w-full max-w-sm space-y-2.5 transition-transform duration-500 group-hover:scale-[1.025]">
        <span className="flex items-center justify-between font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Languages size={12} className="text-emerald-700" /> Việt → Anh</span>
          <span>01 / 12</span>
        </span>

        <span className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all duration-500 group-hover:-translate-y-1 group-hover:border-emerald-300 group-hover:shadow-md">
          <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Nghĩa tiếng Việt</span>
          <span className="mt-1 block text-lg font-bold text-slate-800">chu đáo</span>
        </span>

        <span className="grid grid-cols-2 gap-2">
          <span className="flex min-w-0 items-center justify-between gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 transition-all duration-500 group-hover:-translate-y-0.5 group-hover:border-emerald-500 group-hover:bg-emerald-50 group-hover:text-emerald-800">
            <span className="truncate">thoughtful</span>
            <Check size={14} className="shrink-0 scale-50 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
          </span>
          <span className="flex min-w-0 items-center rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-500 transition-all duration-500 group-hover:translate-y-1 group-hover:opacity-45">
            <span className="truncate">careless</span>
          </span>
        </span>

        <span className="block h-1 overflow-hidden rounded-full bg-slate-200">
          <span className="block h-full w-[10%] rounded-full bg-emerald-500 transition-all duration-700 group-hover:w-[32%]" />
        </span>
      </span>
      <Sparkles className="absolute right-3 top-3 h-5 w-5 -translate-y-2 scale-50 text-amber-500 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100" />
    </span>
  );
}

export default function ToolCard({ tool, index, onOpen, onShare }) {
  const [shake, setShake] = useState(false);

  const handleClick = () => {
    if (tool.isLocked) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.warning(
        tool.lockReason ||
        'Công cụ này hiện đang khóa do chưa có đủ tài liệu kỹ thuật chính thức. Vui lòng sử dụng bản Casio fx-580VN X!'
      );
      return;
    }
    onOpen();
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      initial={{ opacity: 0, y: 12 }}
      animate={
        shake
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0], opacity: 1, y: 0 }
          : { opacity: 1, y: 0 }
      }
      transition={{ delay: index * 0.05 }}
      whileHover={tool.isLocked ? { scale: 0.99 } : { y: -4 }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target === e.currentTarget) handleClick();
        }
      }}
      aria-label={`Mở ${tool.title}`}
      className={`group relative flex h-80 w-full flex-col overflow-hidden rounded-xl bg-[#3d3c3d] p-0 text-left text-white drop-shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
        tool.isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
      }`}
    >
      <span className="absolute inset-0.5 z-[1] flex flex-col justify-between gap-5 rounded-[10px] bg-[#323132] p-4 opacity-95">
        {tool.id === 'Casio580Spell' ? (
          <Casio580Thumbnail />
        ) : tool.id === 'ImageArtStudio' ? (
          <ImageArtThumbnail />
        ) : (
          <DefaultToolThumbnail />
        )}

        <span className="flex w-full items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="block truncate text-lg font-bold">{tool.title}</span>
              {tool.isLocked && (
                <Lock size={15} className="text-amber-400 shrink-0" />
              )}
            </span>
            <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-400 truncate">
              {tool.subtitle || 'WindHub tool'}
            </span>
          </span>

          <span className="flex items-center gap-2 shrink-0">
            {onShare && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(tool);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onShare(tool);
                  }
                }}
                title="Chia sẻ liên kết truy cập nhanh"
                aria-label={`Chia sẻ ${tool.title}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition active:scale-95 border border-white/5"
              >
                <Share2 size={14} />
              </span>
            )}

            {tool.isLocked ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Lock size={14} />
              </span>
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white transition-all duration-300 group-hover:bg-sky-500 group-hover:text-white">
                <ArrowRight className="h-4 w-4 -translate-x-0.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            )}
          </span>
        </span>
      </span>
      <span className="absolute -left-1/2 top-1/2 -z-10 h-48 w-56 bg-amber-800 blur-[50px] transition-all duration-500 group-hover:-left-1/4 group-hover:top-12" />
    </motion.div>
  );
}