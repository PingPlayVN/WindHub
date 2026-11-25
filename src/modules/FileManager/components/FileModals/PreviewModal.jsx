import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Eye, X } from 'lucide-react';
import { modalBackdropVariants, modalPanelVariants } from '@/design-system/motion';
import { IconButton } from '@/components/os';
import PreviewContent from '../Preview/PreviewContent';

export default function PreviewModal({
  previewFile,
  setPreviewFile,
  viewerEngine,
  setViewerEngine,
}) {
  useEffect(() => {
    if (!previewFile) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setPreviewFile(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [previewFile, setPreviewFile]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {previewFile && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-2 sm:p-5">
          <motion.button
            type="button"
            aria-label="Đóng trình xem trước"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setPreviewFile(null)}
            className="absolute inset-0 border-0 cursor-default bg-[var(--os-backdrop)] backdrop-blur-xs"
          />

          <motion.section
            key={previewFile.id}
            role="dialog"
            aria-modal="true"
            aria-label={previewFile.name}
            variants={modalPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="os-floating-surface relative z-10 flex h-[90dvh] sm:h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-[var(--radius-xl)] text-[var(--os-text-primary)]"
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--os-border-subtle)] px-4 sm:px-5 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--os-accent-soft)] text-[var(--os-accent)] border border-[var(--os-accent-border)]">
                  <Eye size={17} />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--os-text-muted)]">
                    Quick Look
                  </p>
                  <h3 className="truncate text-sm sm:text-base font-bold text-[var(--os-text-primary)]">
                    {previewFile.name}
                  </h3>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {!previewFile.isLocked && previewFile.url && (
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Mở trong thẻ mới"
                    aria-label="Mở trong thẻ mới"
                    className="os-focus-ring inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--os-border)] bg-[var(--os-surface-2)] text-[var(--os-text-secondary)] hover:text-[var(--os-accent)] hover:border-[var(--os-accent-border)] transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <IconButton
                  label="Đóng (Esc)"
                  size="sm"
                  variant="subtle"
                  onClick={() => setPreviewFile(null)}
                >
                  <X size={17} />
                </IconButton>
              </div>
            </header>

            <div className="dark flex min-h-0 flex-1 flex-col overflow-hidden bg-[#080a0f] text-slate-100">
              <PreviewContent
                previewFile={previewFile}
                viewerEngine={viewerEngine}
                setViewerEngine={setViewerEngine}
              />
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
