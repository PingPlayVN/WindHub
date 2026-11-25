import { motion } from 'framer-motion';
import { SPRING_OS_SNAPPY } from '@/design-system/motion';

export default function Navigation({
  items = [],
  activeId,
  onSelect,
  layoutId = 'os-segmented-nav',
  size = 'md',
  className = '',
}) {
  const padClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm';

  return (
    <div
      role="tablist"
      className={`os-sunken inline-flex items-center gap-1 rounded-[var(--radius-md)] p-1 ${className}`}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect?.(item)}
            className={`os-focus-ring relative inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] font-semibold whitespace-nowrap cursor-pointer transition-colors duration-[var(--dur-micro)] ${padClass} ${
              isActive
                ? 'text-[var(--os-text-primary)]'
                : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING_OS_SNAPPY}
                className="pointer-events-none absolute inset-0 rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] shadow-[var(--os-shadow-xs)]"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {Icon && <Icon size={15} className={isActive ? 'text-[var(--os-accent)]' : ''} />}
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span className="rounded-full bg-[var(--os-surface-3)] px-1.5 py-0.2 font-mono text-[10px] text-[var(--os-text-muted)]">
                  {item.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
