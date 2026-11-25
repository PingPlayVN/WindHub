import { useState } from 'react';
import { Check, Copy, Keyboard, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { unrollKeyBadges } from '../utils/keyBadgeUtils.js';

export function KeyBadgeRenderer({ text }) {
  if (!text) return null;

  if (text.includes('\n')) {
    const lines = text.split('\n');
    return (
      <div className="space-y-2">
        {lines.map((line, lIdx) => {
          if (!line.trim()) return <div key={lIdx} className="h-1" />;
          return (
            <div key={lIdx} className="leading-relaxed">
              <KeyBadgeRenderer text={line} />
            </div>
          );
        })}
      </div>
    );
  }

  const unrolled = unrollKeyBadges(text);
  const parts = unrolled.split(/(\[[^\]]+\])/g).filter(Boolean);

  return (
    <span className="inline-flex flex-wrap items-center gap-1 leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          const keyName = part.slice(1, -1);
          let keyColor =
            'bg-[var(--os-surface-1)] text-[var(--os-text-primary)] border-[var(--os-border-strong)]';

          if (/shift/i.test(keyName)) {
            keyColor =
              'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35 font-bold';
          } else if (/alpha/i.test(keyName)) {
            keyColor =
              'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35 font-bold';
          } else if (/optn|menu/i.test(keyName)) {
            keyColor =
              'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/35 font-bold';
          } else if (/calc|ans|=/i.test(keyName)) {
            keyColor =
              'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 font-bold';
          } else if (/ac|del/i.test(keyName)) {
            keyColor =
              'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/35 font-bold';
          } else if (/^[↑↓←→><∧∨▲▼◀▶]$/.test(keyName)) {
            keyColor =
              'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/35 font-bold';
          } else if (/x\^|x²|x⁻¹|°'"|□\/□|√|sin|cos|tan|ln/i.test(keyName)) {
            keyColor =
              'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/35 font-bold';
          }

          return (
            <kbd
              key={index}
              className={`inline-flex min-w-[24px] items-center justify-center rounded-md border border-b-2 px-1.5 py-0.5 font-mono text-xs shadow-2xs ${keyColor}`}
            >
              {keyName}
            </kbd>
          );
        }
        return (
          <span key={index} className="px-0.5 font-medium text-[var(--os-text-secondary)]">
            {part}
          </span>
        );
      })}
    </span>
  );
}

export function StepGuideSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(count)].map((_, idx) => (
        <div
          key={idx}
          className="rounded-[var(--radius-lg)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-1)] p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="size-7 rounded-lg bg-[var(--os-surface-3)]" />
            <div className="h-4 w-56 rounded bg-[var(--os-surface-3)]" />
          </div>
          <div className="h-12 w-full rounded-lg bg-[var(--os-surface-2)]" />
        </div>
      ))}
    </div>
  );
}

export default function StepGuide({ steps = [], loading = false }) {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [viewMode, setViewMode] = useState('badges');

  const handleCopy = (text, idx) => {
    if (!text) return;
    const cleanText = unrollKeyBadges(text);
    navigator.clipboard.writeText(cleanText);
    setCopiedIdx(idx);
    toast.success('Đã sao chép chuỗi phím bấm!');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (loading) return <StepGuideSkeleton count={steps?.length || 3} />;
  if (!steps || steps.length === 0) return null;

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
          Quy trình thao tác ({steps.length} bước)
        </span>
        <div className="os-sunken inline-flex items-center gap-1 rounded-[var(--radius-sm)] p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('badges')}
            className={`os-focus-ring inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold cursor-pointer transition-colors ${
              viewMode === 'badges'
                ? 'bg-[var(--os-surface-1)] text-[var(--os-accent)] font-bold shadow-2xs'
                : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
            }`}
          >
            <Keyboard size={13} />
            <span>Phím trực quan</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('compact')}
            className={`os-focus-ring inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold cursor-pointer transition-colors ${
              viewMode === 'compact'
                ? 'bg-[var(--os-surface-1)] text-[var(--os-accent)] font-bold shadow-2xs'
                : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
            }`}
          >
            <Terminal size={13} />
            <span>Chuỗi văn bản</span>
          </button>
        </div>
      </div>

      {steps.map((s, idx) => (
        <div
          key={idx}
          className="rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-4 sm:p-5 transition-colors hover:border-[var(--os-border-strong)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[var(--os-info-border)] bg-[var(--os-info-soft)] font-mono text-xs font-bold text-[var(--os-info)]">
                {s.step || idx + 1}
              </span>
              <h4 className="text-sm sm:text-base font-bold text-[var(--os-text-primary)]">
                {s.title}
              </h4>
            </div>

            {s.keys && (
              <button
                type="button"
                onClick={() => handleCopy(s.keys, idx)}
                className="os-focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-xs)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)] cursor-pointer transition-colors"
              >
                {copiedIdx === idx ? (
                  <Check size={13} className="text-[var(--os-success)]" />
                ) : (
                  <Copy size={13} />
                )}
                <span>{copiedIdx === idx ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            )}
          </div>

          {s.desc && (
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--os-text-secondary)] sm:pl-10">
              {s.desc}
            </p>
          )}

          {s.keys && (
            <div className="os-sunken mt-3 rounded-[var(--radius-md)] p-3 font-mono text-xs sm:ml-10">
              {viewMode === 'badges' ? (
                <KeyBadgeRenderer text={s.keys} />
              ) : (
                <div className="break-all font-mono text-xs text-[var(--os-info)] select-all">
                  {unrollKeyBadges(s.keys)}
                </div>
              )}
            </div>
          )}

          {s.displayTemplates && s.displayTemplates.length > 0 && (
            <div className="mt-3 space-y-2 sm:ml-10">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--os-info)]">
                Màn hình Casio hiển thị
              </p>
              <div className="space-y-1.5 font-mono text-xs">
                {s.displayTemplates.map((tmpl, tIdx) => (
                  <div
                    key={tIdx}
                    className="flex items-center justify-between rounded-[var(--radius-sm)] border border-slate-800 bg-[#0d121a] px-3 py-2 text-emerald-400"
                  >
                    <span className="font-bold tracking-wide">{tmpl}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(tmpl, `tmpl-${tIdx}`)}
                      className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
                      title="Sao chép giá trị dòng"
                    >
                      {copiedIdx === `tmpl-${tIdx}` ? (
                        <Check size={13} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {s.waysToInput && s.waysToInput.length > 0 && (
            <div className="mt-3 space-y-2 sm:ml-10">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--os-warning)]">
                {s.waysTitle || 'Cách thực hiện'}
              </p>
              <div className="space-y-1.5">
                {s.waysToInput.map((way, wIdx) => (
                  <div
                    key={wIdx}
                    className="os-sunken rounded-[var(--radius-md)] p-2.5 font-mono text-xs"
                  >
                    {viewMode === 'badges' ? (
                      <KeyBadgeRenderer text={way} />
                    ) : (
                      <div className="break-all font-mono text-xs text-[var(--os-info)] select-all">
                        {unrollKeyBadges(way)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {s.calcRepeat && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[var(--os-warning-border)] bg-[var(--os-warning-soft)] px-3 py-2 font-mono text-xs text-[var(--os-text-primary)] sm:ml-10">
              <span className="font-bold text-[var(--os-warning)] shrink-0">Bấm tiếp:</span>
              <KeyBadgeRenderer text={s.calcRepeat} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
