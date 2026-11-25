import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { DUR, EASE_OS_IN, EASE_OS_SHEET, modalBackdropVariants } from '@/design-system/motion';
import IconButton from './IconButton';

export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  side = 'right',
  children,
  footer,
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

  const isLeft = side === 'left';

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[var(--z-drawer)] flex">
          <motion.button
            type="button"
            aria-label="Đóng ngăn kéo"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 border-0 cursor-default bg-[var(--os-backdrop)] backdrop-blur-xs"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={{ x: isLeft ? '-100%' : '100%' }}
            animate={{ x: 0, transition: { duration: DUR.large, ease: EASE_OS_SHEET } }}
            exit={{ x: isLeft ? '-100%' : '100%', transition: { duration: DUR.largeExit, ease: EASE_OS_IN } }}
            className={`os-floating-surface relative z-10 flex h-full w-[min(88vw,360px)] flex-col text-[var(--os-text-primary)] ${
              isLeft
                ? 'mr-auto rounded-r-[var(--radius-xl)] border-l-0'
                : 'ml-auto rounded-l-[var(--radius-xl)] border-r-0'
            } ${className}`}
          >
            {(title || onClose) && (
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--os-border-subtle)] px-5 py-4">
                <div className="min-w-0">
                  {subtitle && (
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">
                      {subtitle}
                    </p>
                  )}
                  {title && (
                    <h2 id={titleId} className="truncate text-base font-bold">
                      {title}
                    </h2>
                  )}
                </div>
                {onClose && (
                  <IconButton label="Đóng" size="sm" variant="subtle" onClick={onClose}>
                    <X size={17} />
                  </IconButton>
                )}
              </header>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-4">{children}</div>

            {footer && (
              <footer className="shrink-0 border-t border-[var(--os-border-subtle)] p-4">{footer}</footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
