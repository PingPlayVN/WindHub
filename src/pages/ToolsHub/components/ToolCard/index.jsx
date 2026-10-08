import { motion } from 'framer-motion';
import { ArrowRight, Check, Languages, Sparkles } from 'lucide-react';

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

export default function ToolCard({ tool, index, onOpen }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      onClick={onOpen}
      aria-label={`Mở ${tool.title}`}
      className="group relative flex h-80 w-full flex-col overflow-hidden rounded-xl bg-[#3d3c3d] p-0 text-left text-white drop-shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      <span className="absolute inset-0.5 z-[1] flex flex-col justify-between gap-5 rounded-[10px] bg-[#323132] p-4 opacity-95">
        {tool.id === 'ImageArtStudio' ? <ImageArtThumbnail /> : (
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
        )}

        <span className="flex w-full items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate text-lg font-bold">{tool.title}</span>
            <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-400">WindHub tool</span>
          </span>
          <ArrowRight className="h-7 w-7 shrink-0 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
        </span>
      </span>
      <span className="absolute -left-1/2 top-1/2 -z-10 h-48 w-56 bg-amber-800 blur-[50px] transition-all duration-500 group-hover:-left-1/4 group-hover:top-12" />
    </motion.button>
  );
}