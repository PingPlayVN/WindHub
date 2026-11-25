const SIZE_CLASSES = {
  sm: 'size-8 rounded-[var(--radius-sm)]',
  md: 'size-9.5 rounded-[var(--radius-md)]',
  lg: 'size-11 rounded-[var(--radius-md)]',
};

const VARIANT_CLASSES = {
  ghost:
    'bg-transparent border-transparent text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)]',
  subtle:
    'bg-[var(--os-surface-2)] border-[var(--os-border-subtle)] text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-3)] hover:text-[var(--os-text-primary)] hover:border-[var(--os-border-default)]',
  active:
    'bg-[var(--os-accent-soft)] border-[var(--os-accent-border)] text-[var(--os-accent)] hover:bg-[var(--os-accent-soft-hover)]',
  danger:
    'bg-transparent border-transparent text-[var(--os-danger)] hover:bg-[var(--os-danger-soft)]',
};

export default function IconButton({
  label,
  title,
  size = 'md',
  variant = 'ghost',
  active = false,
  badge,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const effectiveVariant = active ? 'active' : variant;
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      title={title ?? label}
      className={`os-focus-ring relative inline-flex shrink-0 items-center justify-center border cursor-pointer select-none transition-[background-color,border-color,color,transform] duration-[var(--dur-micro)] ease-[var(--ease-os-out)] active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed ${
        SIZE_CLASSES[size] || SIZE_CLASSES.md
      } ${VARIANT_CLASSES[effectiveVariant] || VARIANT_CLASSES.ghost} ${className}`}
    >
      {children}
      {badge !== undefined && badge !== null && badge !== false && (
        <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-[var(--os-accent)] px-1 text-[10px] font-bold text-[var(--os-accent-fg)] shadow-xs">
          {badge}
        </span>
      )}
    </button>
  );
}
