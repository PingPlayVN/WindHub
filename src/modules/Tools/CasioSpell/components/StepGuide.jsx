import { useState } from 'react';
import { Copy, Check, Terminal, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Tự động tháo gỡ (unroll) toàn bộ các ký hiệu nhân lặp phím:
 * ([←] [9] [DEL])×2 -> [←] [9] [DEL] [←] [9] [DEL]
 * [DEL]×10 -> 10 lần [DEL]
 * [16 số bất kì] -> 16 lần [1]
 */
export function unrollKeyBadges(text) {
  if (!text) return '';
  let s = text;

  s = s.replace(/\(([^)]+)\)\s*[×x]\s*(\d+)\s*lần/gi, (_, inner, count) => {
    const n = parseInt(count, 10);
    if (isNaN(n) || n <= 0) return '';
    return Array(n).fill(inner.trim()).join(' ');
  });

  s = s.replace(/\(([^)]+)\)\s*[×x]\s*(\d+)/gi, (_, inner, count) => {
    const n = parseInt(count, 10);
    if (isNaN(n) || n <= 0) return '';
    return Array(n).fill(inner.trim()).join(' ');
  });

  s = s.replace(/(\[[^\]]+\])\s*[×x]\s*(\d+)(\s*lần)?/gi, (_, key, count) => {
    const n = parseInt(count, 10);
    if (isNaN(n) || n <= 0) return '';
    return Array(n).fill(key.trim()).join(' ');
  });

  s = s.replace(/\[(\d+)\s*số\s*bất\s*k[ìỳ]\]/gi, (match, count) => {
    const n = parseInt(count, 10);
    if (isNaN(n) || n <= 0) return '';
    if (n > 10) return match;
    if (n === 9) return '[1] [2] [3] [4] [5] [6] [7] [8] [9]';
    return Array(n).fill('[1]').join(' ');
  });

  s = s.replace(/\]\s*\[/g, '] [');
  s = s.replace(/\[<\]/g, '[←]')
    .replace(/\[>\]/g, '[→]')
    .replace(/\[[\^∧]\]/g, '[↑]')
    .replace(/\[[v∨]\]/g, '[↓]');

  return s;
}

export function KeyBadgeRenderer({ text }) {
  if (!text) return null;
  const unrolled = unrollKeyBadges(text);
  const parts = unrolled.split(/(\[[^\]]+\])/g).filter(Boolean);

  return (
    <span className="inline-flex flex-wrap items-center gap-1 leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          const keyName = part.slice(1, -1);
          let keyColor = 'bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-slate-300 dark:border-zinc-700';

          if (/shift/i.test(keyName)) {
            keyColor = 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold';
          } else if (/alpha/i.test(keyName)) {
            keyColor = 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-bold';
          } else if (/optn|menu/i.test(keyName)) {
            keyColor = 'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700 font-bold';
          } else if (/calc|ans|=/i.test(keyName)) {
            keyColor = 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-bold';
          } else if (/ac|del/i.test(keyName)) {
            keyColor = 'bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700 font-bold';
          } else if (/^[↑↓←→><∧∨]$/.test(keyName)) {
            keyColor = 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-bold';
          }

          return (
            <span
              key={index}
              className={`inline-flex items-center justify-center px-1.5 py-0.5 min-w-[24px] text-xs font-mono rounded shadow-xs border transition hover:scale-105 ${keyColor}`}
            >
              {keyName}
            </span>
          );
        }
        return <span key={index} className="text-slate-700 dark:text-slate-300 font-medium px-0.5">{part}</span>;
      })}
    </span>
  );
}

export function StepGuideSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between px-1">
        <div className="h-4 w-44 rounded-md bg-slate-200 dark:bg-zinc-800" />
        <div className="h-7 w-48 rounded-xl bg-slate-200 dark:bg-zinc-800" />
      </div>
      {[...Array(count)].map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4 sm:p-5 shadow-xs space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-sky-500/20" />
              <div className="h-5 w-48 sm:w-64 rounded-lg bg-slate-200 dark:bg-zinc-800" />
            </div>
            <div className="h-7 w-20 rounded-lg bg-slate-200 dark:bg-zinc-800" />
          </div>
          <div className="ml-10 space-y-2">
            <div className="h-3.5 w-5/6 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
          <div className="mt-3 ml-10 p-3 rounded-xl bg-slate-100 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800/80 flex flex-wrap gap-1.5">
            {[14, 16, 12, 18, 14, 16, 20, 12].map((w, i) => (
              <div key={i} className="h-6 rounded bg-slate-200 dark:bg-zinc-800" style={{ width: `${w * 3}px` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StepGuide({ steps = [], loading = false }) {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [viewMode, setViewMode] = useState('badges'); // 'badges' | 'compact'

  const handleCopy = (text, idx) => {
    if (!text) return;
    const cleanText = unrollKeyBadges(text);
    navigator.clipboard.writeText(cleanText);
    setCopiedIdx(idx);
    toast.success('Đã sao chép công thức phím!');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (loading) {
    return <StepGuideSkeleton count={steps?.length || 3} />;
  }

  if (!steps || steps.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-bold">
          Quy trình bấm phím ({steps.length} bước)
        </span>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('badges')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition ${viewMode === 'badges'
                ? 'bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <Sparkles size={12} />
            <span>Phím trực quan</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('compact')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition ${viewMode === 'compact'
                ? 'bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <Terminal size={12} />
            <span>Chuỗi một dòng</span>
          </button>
        </div>
      </div>

      {steps.map((s, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 p-4 sm:p-5 shadow-xs transition hover:border-sky-300 dark:hover:border-zinc-700"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 dark:bg-sky-400/10 font-mono text-xs font-bold text-sky-600 dark:text-sky-400 border border-sky-500/20">
                {s.step || idx + 1}
              </span>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                {s.title}
              </h4>
            </div>

            {s.keys && (
              <button
                type="button"
                onClick={() => handleCopy(s.keys, idx)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
              >
                {copiedIdx === idx ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copiedIdx === idx ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            )}
          </div>

          {s.desc && (
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-10">
              {s.desc}
            </p>
          )}

          {s.keys && (
            <div className="mt-3 ml-10 p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200/80 dark:border-zinc-800/80 font-mono text-xs">
              {viewMode === 'badges' ? (
                <KeyBadgeRenderer text={s.keys} />
              ) : (
                <div className="font-mono text-xs text-sky-600 dark:text-sky-400 break-all select-all">
                  {unrollKeyBadges(s.keys)}
                </div>
              )}
            </div>
          )}

          {/* Display Templates (cho Casio 580 Bước 4 & Bước 6) */}
          {s.displayTemplates && s.displayTemplates.length > 0 && (
            <div className="mt-3 ml-10 space-y-2">
              <p className="font-mono text-xs text-sky-500 font-semibold uppercase tracking-wider">
                Màn hình Casio hiển thị:
              </p>
              <div className="space-y-1.5 font-mono text-xs">
                {s.displayTemplates.map((tmpl, tIdx) => (
                  <div key={tIdx} className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800 flex items-center justify-between shadow-inner">
                    <span className="font-bold tracking-wide">{tmpl}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(tmpl, `tmpl-${tIdx}`)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Sao chép giá trị dòng"
                    >
                      {copiedIdx === `tmpl-${tIdx}` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ways to input (Cách nhập từng biến / Cách làm) */}
          {s.waysToInput && s.waysToInput.length > 0 && (
            <div className="mt-3 ml-10 space-y-2">
              <p className="font-mono text-xs text-amber-500 font-semibold uppercase tracking-wider">
                {s.waysTitle || 'Cách thực hiện:'}
              </p>
              <div className="space-y-1.5">
                {s.waysToInput.map((way, wIdx) => (
                  <div
                    key={wIdx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200/80 dark:border-zinc-800/80 font-mono text-xs"
                  >
                    {viewMode === 'badges' ? (
                      <KeyBadgeRenderer text={way} />
                    ) : (
                      <div className="font-mono text-xs text-sky-600 dark:text-sky-400 break-all select-all">
                        {unrollKeyBadges(way)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calc repeat button indicator */}
          {s.calcRepeat && (
            <div className="mt-3 ml-10 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <span className="font-bold shrink-0">Bấm tiếp:</span>
              <KeyBadgeRenderer text={s.calcRepeat} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
