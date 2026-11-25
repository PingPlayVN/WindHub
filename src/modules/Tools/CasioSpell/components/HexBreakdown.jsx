import { Hash } from 'lucide-react';
import { CHAR_TO_HEX } from '../data/casio580AxesmcData.js';

export function HexBreakdownSkeleton({ count = 8 }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-4 sm:p-5 animate-pulse">
      <div className="h-4 w-48 rounded bg-[var(--os-surface-3)] mb-4" />
      <div className="flex flex-wrap gap-2">
        {[...Array(count)].map((_, index) => (
          <div
            key={index}
            className="h-16 w-13 rounded-[var(--radius-sm)] bg-[var(--os-surface-2)]"
          />
        ))}
      </div>
    </div>
  );
}

export default function HexBreakdown({ text = '', loading = false }) {
  if (loading) return <HexBreakdownSkeleton count={text?.length || 8} />;
  if (!text) return null;

  const chars = Array.from(text);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-[var(--os-border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Hash size={16} className="text-[var(--os-info)]" />
          <h4 className="text-sm sm:text-base font-bold text-[var(--os-text-primary)]">
            Bảng giải mã từng ký tự (Hex Breakdown)
          </h4>
        </div>
        <span className="font-mono text-xs font-semibold text-[var(--os-text-muted)]">
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
              className={`flex min-w-[50px] flex-col items-center rounded-[var(--radius-sm)] border p-2 font-mono transition-transform hover:-translate-y-0.5 ${
                isMultiByte
                  ? 'border-[var(--os-warning-border)] bg-[var(--os-warning-soft)]'
                  : 'border-[var(--os-border-subtle)] bg-[var(--os-surface-2)]'
              }`}
            >
              <span className="font-sans text-[10px] text-[var(--os-text-muted)]">
                #{index + 1}
              </span>
              <span className="my-1 text-base font-extrabold text-[var(--os-text-primary)]">
                {isSpace ? '␣' : char}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  isMultiByte
                    ? 'bg-[var(--os-surface-1)] text-[var(--os-warning)]'
                    : 'bg-[var(--os-surface-3)] text-[var(--os-text-secondary)]'
                }`}
              >
                {hex}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[var(--os-border-subtle)] pt-3 font-mono text-xs text-[var(--os-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-xs bg-[var(--os-surface-3)] border border-[var(--os-border-default)]" />
          <span>1 Byte (ASCII chuẩn)</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-xs bg-[var(--os-warning)]" />
          <span>2 Bytes (Tiếng Việt F4 xx)</span>
        </span>
      </div>
    </div>
  );
}
