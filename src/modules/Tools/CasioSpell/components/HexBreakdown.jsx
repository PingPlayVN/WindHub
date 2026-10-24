import { Hash } from 'lucide-react';
import { CHAR_TO_HEX } from '../data/casio580AxesmcData.js';

export function HexBreakdownSkeleton({ count = 8 }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4 sm:p-5 shadow-xs animate-pulse">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-sky-500/30" />
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-zinc-800" />
        </div>
        <div className="h-3 w-16 rounded bg-slate-200 dark:bg-zinc-800" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[...Array(count)].map((_, index) => (
          <div
            key={index}
            className="flex flex-col items-center min-w-[48px] p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 space-y-1.5"
          >
            <div className="h-2.5 w-4 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-5 w-6 rounded bg-slate-300 dark:bg-zinc-700 my-0.5" />
            <div className="h-3.5 w-7 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HexBreakdown({ text = '', model = 'fx-580VN X', loading = false }) {
  if (loading) return <HexBreakdownSkeleton count={text?.length || 8} />;
  if (!text) return null;

  const chars = Array.from(text);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Hash size={16} className="text-sky-500" />
          <h4 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">
            Bảng giải mã từng ký tự (Hex Breakdown)
          </h4>
        </div>
        <span className="font-mono text-xs text-slate-500">
          {chars.length} ký tự
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {chars.map((char, index) => {
          const hex = CHAR_TO_HEX[char] || '20';
          const isMultiByte = hex.includes(' ') || hex.startsWith('F4');
          const isSpace = char === ' ';

          return (
            <div
              key={index}
              className={`flex flex-col items-center min-w-[48px] p-2 rounded-xl border font-mono transition-transform hover:-translate-y-0.5 ${
                isMultiByte
                  ? 'border-amber-300/80 bg-amber-50/60 dark:border-amber-700/50 dark:bg-amber-950/30'
                  : 'border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60'
              }`}
            >
              <span className="text-xs text-slate-400 font-sans">#{index + 1}</span>
              <span className="text-base font-bold my-1 text-slate-800 dark:text-slate-100">
                {isSpace ? '␣' : char}
              </span>
              <span
                className={`text-[10px] px-1 py-0.5 rounded font-semibold ${
                  isMultiByte
                    ? 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                {hex}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-zinc-700" />
          <span>1 Byte (ASCII chuẩn)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-300 dark:bg-amber-600" />
          <span>2 Bytes (Tiếng Việt có dấu F4 xx)</span>
        </div>
      </div>
    </div>
  );
}
