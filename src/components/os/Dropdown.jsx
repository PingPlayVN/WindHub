import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { DUR, EASE_OS_IN, EASE_OS_OUT } from '@/design-system/motion';

export default function Dropdown({
  value,
  options = [],
  onChange,
  icon,
  label,
  align = 'right',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selected = options.find((opt) => opt.id === value) || options[0];

  return (
    <div ref={containerRef} className={`relative inline-block shrink-0 ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label || selected?.label}
        onClick={() => setOpen((prev) => !prev)}
        className={`os-focus-ring inline-flex h-10.5 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border px-3.5 text-xs sm:text-sm font-semibold cursor-pointer transition-[border-color,background-color] duration-[var(--dur-micro)] ${
          open
            ? 'border-[var(--os-accent)] bg-[var(--os-surface-1)] text-[var(--os-text-primary)]'
            : 'border-[var(--os-border-default)] bg-[var(--os-surface-2)] text-[var(--os-text-primary)] hover:border-[var(--os-border-strong)]'
        }`}
      >
        <span className="inline-flex min-w-0 items-center gap-2 truncate">
          {icon && <span className="text-[var(--os-text-muted)] shrink-0">{icon}</span>}
          <span className="truncate">{selected?.label}</span>
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={`shrink-0 text-[var(--os-text-muted)] transition-transform duration-[var(--dur-ui)] ${
            open ? 'rotate-180 text-[var(--os-accent)]' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: DUR.ui, ease: EASE_OS_OUT } }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: DUR.uiExit, ease: EASE_OS_IN } }}
            style={{ transformOrigin: align === 'left' ? 'top left' : 'top right' }}
            className={`os-floating-surface absolute z-[var(--z-dropdown)] mt-2 min-w-44 overflow-hidden rounded-[var(--radius-md)] p-1.5 ${
              align === 'left' ? 'left-0' : 'right-0'
            }`}
          >
            {options.map((opt) => {
              const isSelected = opt.id === value;
              return (
                <li key={opt.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange?.(opt.id);
                      setOpen(false);
                    }}
                    className={`os-focus-ring flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[var(--os-accent-soft)] text-[var(--os-accent)] font-semibold'
                        : 'text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)]'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={14} className="shrink-0 text-[var(--os-accent)]" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
