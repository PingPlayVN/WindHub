export default function EmptyState({
  icon,
  title = 'Chưa có dữ liệu',
  description,
  action,
  compact = false,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-8 px-4' : 'py-14 px-6'
      } ${className}`}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="mb-4 flex size-14 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] text-[var(--os-accent)] shadow-[var(--os-shadow-xs)]"
        >
          {icon}
        </div>
      )}
      <h3 className="text-base sm:text-lg font-bold tracking-tight text-[var(--os-text-primary)]">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-md text-xs sm:text-sm leading-relaxed text-[var(--os-text-muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">{action}</div>}
    </div>
  );
}
