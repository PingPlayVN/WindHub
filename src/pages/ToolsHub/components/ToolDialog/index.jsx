import { Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2, Share2, X } from 'lucide-react';
import { modalBackdropVariants, modalPanelVariants } from '@/design-system/motion';
import IconButton from '@/components/os/IconButton';
import LoadingState from '@/components/os/LoadingState';
import { ToolEmblem } from '@/components/studio/StudioPrimitives';

export default function ToolDialog({ tool, onClose, onShare }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!tool) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tool, onClose]);

  if (!tool || typeof document === 'undefined') return null;
  const Tool = tool.Component;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.button
          type="button"
          aria-label="Đóng công cụ"
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
          aria-labelledby="tool-dialog-title"
          variants={modalPanelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`os-floating-surface relative z-10 flex flex-col overflow-hidden text-[var(--os-text-primary)] transition-[max-width,height] duration-200 ${
            expanded
              ? 'h-[96dvh] w-full max-w-[97vw] rounded-[var(--radius-xl)]'
              : 'max-h-[94dvh] sm:max-h-[91vh] w-full max-w-6xl rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)]'
          }`}
        >
          {/* Window Chrome Bar */}
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--os-border-subtle)] bg-[var(--os-surface-1)]/95 px-4 sm:px-5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8.5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
                <ToolEmblem variant={tool.emblem || 'casio'} size={17} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--os-text-muted)]">
                    {tool.categoryLabel || 'WINDOS TOOL'}
                  </span>
                  {tool.runtimeNote && (
                    <span className="hidden sm:inline-block rounded-md bg-[var(--os-surface-2)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--os-text-muted)]">
                      {tool.runtimeNote}
                    </span>
                  )}
                </div>
                <h2 id="tool-dialog-title" className="truncate text-sm sm:text-base font-bold text-[var(--os-text-primary)]">
                  {tool.title}
                </h2>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {onShare && (
                <IconButton
                  label="Chia sẻ liên kết công cụ"
                  size="sm"
                  variant="subtle"
                  onClick={() => onShare(tool)}
                >
                  <Share2 size={15} />
                </IconButton>
              )}
              <IconButton
                label={expanded ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn khung'}
                size="sm"
                variant="subtle"
                onClick={() => setExpanded((v) => !v)}
                className="hidden sm:inline-flex"
              >
                {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </IconButton>
              <IconButton label="Đóng công cụ (Esc)" size="sm" variant="subtle" onClick={onClose}>
                <X size={17} />
              </IconButton>
            </div>
          </header>

          {/* Theme-aware WindOS Studio Viewport */}
          <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar bg-[var(--os-bg)] p-4 sm:p-6 text-[var(--os-text-primary)]">
            <Suspense fallback={<LoadingState label={`Đang khởi tạo ${tool.title}...`} />}>
              <Tool />
            </Suspense>
          </div>
        </motion.section>
      </div>
    </AnimatePresence>,
    document.body
  );
}
