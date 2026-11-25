import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { modalBackdropVariants, modalPanelVariants } from '@/design-system/motion';
import IconButton from './IconButton';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-5xl',
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  footer,
  headerActions,
  children,
  bodyClassName = '',
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
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.button
            type="button"
            aria-label="Đóng cửa sổ"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 border-0 cursor-default bg-[var(--os-backdrop)] backdrop-blur-xs"
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            variants={modalPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`os-floating-surface relative z-10 flex max-h-[92dvh] sm:max-h-[88vh] w-full flex-col overflow-hidden rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] text-[var(--os-text-primary)] ${
              SIZE_CLASSES[size] || SIZE_CLASSES.md
            } ${className}`}
          >
            {(title || headerActions || onClose) && (
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--os-border-subtle)] px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  {icon && (
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--os-accent-soft)] text-[var(--os-accent)] border border-[var(--os-accent-border)]"
                    >
                      {icon}
                    </span>
                  )}
                  <div className="min-w-0">
                    {subtitle && (
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">
                        {subtitle}
                      </p>
                    )}
                    {title && (
                      <h2 id={titleId} className="truncate text-base sm:text-lg font-bold tracking-tight">
                        {title}
                      </h2>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {headerActions}
                  {onClose && (
                    <IconButton label="Đóng" size="sm" variant="subtle" onClick={onClose}>
                      <X size={17} />
                    </IconButton>
                  )}
                </div>
              </header>
            )}

            <div className={`min-h-0 flex-1 overflow-y-auto custom-scrollbar p-5 ${bodyClassName}`}>
              {children}
            </div>

            {footer && (
              <footer className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[var(--os-border-subtle)] bg-[var(--os-surface-2)]/60 px-5 py-3.5">
                {footer}
              </footer>
            )}
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
