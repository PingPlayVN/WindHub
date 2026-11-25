import { motion } from 'framer-motion';
import { SPRING_OS_SNAPPY } from '@/design-system/motion';

/**
 * Bespoke vector emblems for each WindHub Tool & Extension so every module has
 * an unmistakable commercial product identity without relying on emojis.
 */
export function ToolEmblem({ variant = 'casio', size = 22, className = '' }) {
  if (variant === 'casio') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
      >
        <rect x="4" y="2.5" width="16" height="19" rx="3" />
        <rect x="7" y="5.5" width="10" height="4.5" rx="1" fill="currentColor" fillOpacity="0.16" />
        <path d="M7.5 13.5h2M11 13.5h2M14.5 13.5h2" />
        <path d="M7.5 17h2M11 17h2M14.5 17h2" />
      </svg>
    );
  }

  if (variant === 'ascii') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M12 3v18" strokeDasharray="2 2" />
        <circle cx="7.5" cy="8.5" r="1.6" fill="currentColor" stroke="none" />
        <path d="M4.5 16.5l3-3.5 2.5 2.5" />
        <path d="M15 8h3M15 12h3M15 16h2" />
      </svg>
    );
  }

  if (variant === 'vocab') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
      >
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z" />
        <path d="M4 19a2.5 2.5 0 0 1 2.5-2.5H19" />
        <path d="M8.5 8h6.5M8.5 11.5h4.5" />
      </svg>
    );
  }

  if (variant === 'fb-osint') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.6-3.6" />
        <path d="M11 7.5v7M7.5 11h7" opacity="0.55" />
        <circle cx="11" cy="11" r="2.4" fill="currentColor" fillOpacity="0.2" />
      </svg>
    );
  }

  // anime-trace
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <polygon points="10 8.8 15.5 12 10 15.2 10 8.8" fill="currentColor" fillOpacity="0.18" />
    </svg>
  );
}

/**
 * Clean workspace header inside individual tools & extensions.
 * Uses subtle hairline divider instead of wrapping everything in another thick card.
 */
export function StudioWorkspaceHeader({
  eyebrow,
  title,
  description,
  emblemVariant,
  tone = 'orange',
  badges = [],
  actions,
}) {
  const toneStyles = {
    orange:
      'border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]',
    sky: 'border-[var(--os-info-border)] bg-[var(--os-info-soft)] text-[var(--os-info)]',
    emerald:
      'border-[var(--os-success-border)] bg-[var(--os-success-soft)] text-[var(--os-success)]',
    violet:
      'border-violet-500/30 bg-violet-500/12 text-violet-600 dark:text-violet-300',
  }[tone] || 'border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]';

  return (
    <div className="flex flex-col gap-4 border-b border-[var(--os-border-subtle)] pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3.5 min-w-0">
        {emblemVariant && (
          <span
            className={`mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border ${toneStyles}`}
          >
            <ToolEmblem variant={emblemVariant} size={22} />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--os-text-muted)]">
                {eyebrow}
              </span>
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--os-text-secondary)]"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
          <h3 className="mt-0.5 text-lg sm:text-xl font-extrabold tracking-tight text-[var(--os-text-primary)]">
            {title}
          </h3>
          {description && (
            <p className="mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed text-[var(--os-text-secondary)]">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * Shared layout-animated segmented tab / category switcher.
 */
export function StudioSegmentedBar({
  items,
  activeId,
  onSelect,
  layoutId,
  ariaLabel = 'Chuyển đổi chế độ',
  size = 'md',
  className = '',
}) {
  const pad = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`os-sunken inline-flex flex-wrap items-center gap-1 rounded-[var(--radius-md)] p-1 ${className}`}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(item.id)}
            className={`os-focus-ring relative inline-flex items-center gap-2 rounded-[var(--radius-sm)] font-semibold cursor-pointer transition-colors ${pad} ${
              active
                ? 'text-[var(--os-text-primary)] font-bold'
                : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING_OS_SNAPPY}
                className="pointer-events-none absolute inset-0 rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] shadow-[var(--os-shadow-xs)]"
              />
            )}
            {Icon && (
              <Icon
                size={size === 'sm' ? 14 : 15}
                className={`relative z-10 shrink-0 ${
                  active ? 'text-[var(--os-accent)]' : 'text-[var(--os-text-muted)]'
                }`}
              />
            )}
            <span className="relative z-10 whitespace-nowrap">{item.label}</span>
            {typeof item.count === 'number' && (
              <span
                className={`relative z-10 rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                  active
                    ? 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]'
                    : 'bg-[var(--os-surface-2)] text-[var(--os-text-muted)]'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
