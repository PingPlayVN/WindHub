import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { bottomSheetVariants, modalBackdropVariants } from '@/design-system/motion';
import IconButton from './IconButton';

export default function BottomSheet({
  open,
  onClose,
  title,
  headerSlot,
  children,
  className = '',
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="Đóng bảng chọn"
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
            aria-labelledby={title ? titleId : undefined}
            variants={bottomSheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`os-floating-surface relative z-10 flex max-h-[86dvh] w-full max-w-lg flex-col rounded-t-[var(--radius-2xl)] border-b-0 px-4 pt-3 pb-[calc(1.25rem+var(--safe-bottom))] text-[var(--os-text-primary)] ${className}`}
          >
            <div className="mx-auto mb-3 h-1.5 w-11 shrink-0 rounded-full bg-[var(--os-border-strong)]" />

            {headerSlot ? (
              headerSlot
            ) : (
              title && (
                <div className="mb-3 flex items-center justify-between border-b border-[var(--os-border-subtle)] pb-3 px-1">
                  <h3 id={titleId} className="text-base font-bold">
                    {title}
                  </h3>
                  {onClose && (
                    <IconButton label="Đóng" size="sm" variant="subtle" onClick={onClose}>
                      <X size={17} />
                    </IconButton>
                  )}
                </div>
              )
            )}

            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">{children}</div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
