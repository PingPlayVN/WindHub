import React from 'react';
import { ChevronRight, CornerUpLeft, Folder } from 'lucide-react';

export default function Breadcrumb({ path, handleNavigateTo }) {
  return (
    <nav
      aria-label="Đường dẫn thư mục"
      className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5 touch-pan-x"
    >
      {path.length > 1 && (
        <button
          type="button"
          onClick={() => handleNavigateTo(path.length - 2)}
          title="Quay lại thư mục cha"
          aria-label="Quay lại thư mục cha"
          className="os-focus-ring flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] text-[var(--os-text-secondary)] hover:border-[var(--os-border-strong)] hover:text-[var(--os-text-primary)] cursor-pointer transition-colors"
        >
          <CornerUpLeft size={15} />
        </button>
      )}

      {path.map((p, idx) => {
        const isLast = idx === path.length - 1;
        return (
          <React.Fragment key={p.id}>
            <button
              type="button"
              onClick={() => handleNavigateTo(idx)}
              aria-current={isLast ? 'location' : undefined}
              className={`os-focus-ring inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-xs sm:text-sm cursor-pointer transition-colors ${
                isLast
                  ? 'border border-[var(--os-border-default)] bg-[var(--os-surface-1)] font-bold text-[var(--os-text-primary)] shadow-[var(--os-shadow-xs)]'
                  : 'text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)] font-medium'
              }`}
            >
              {idx === 0 && <Folder size={13} className="text-[var(--os-accent)] shrink-0" />}
              <span>{p.name}</span>
            </button>
            {!isLast && (
              <ChevronRight size={14} aria-hidden="true" className="shrink-0 text-[var(--os-text-subtle)]" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
