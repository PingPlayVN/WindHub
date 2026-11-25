import { Loader2 } from 'lucide-react';

const VARIANT_CLASSES = {
  primary:
    'bg-[var(--os-accent)] text-[var(--os-accent-fg)] border-transparent shadow-[var(--os-shadow-accent)] hover:bg-[var(--os-accent-hover)] active:bg-[var(--os-accent-active)]',
  secondary:
    'bg-[var(--os-surface-2)] text-[var(--os-text-primary)] border-[var(--os-border-default)] shadow-[var(--os-shadow-xs)] hover:bg-[var(--os-surface-3)] hover:border-[var(--os-border-strong)]',
  outline:
    'bg-[var(--os-surface-1)]/70 text-[var(--os-text-primary)] border-[var(--os-border-strong)] hover:bg-[var(--os-surface-hover)] hover:border-[var(--os-accent-border)]',
  subtle:
    'bg-[var(--os-accent-soft)] text-[var(--os-accent)] border-[var(--os-accent-border)] hover:bg-[var(--os-accent-soft-hover)]',
  ghost:
    'bg-transparent text-[var(--os-text-secondary)] border-transparent hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)]',
  danger:
    'bg-[var(--os-danger)] text-white border-transparent shadow-sm hover:bg-[var(--os-danger-hover)]',
  dangerSoft:
    'bg-[var(--os-danger-soft)] text-[var(--os-danger)] border-[var(--os-danger-border)] hover:opacity-90',
  glass:
    'os-glass-surface bg-[var(--os-surface-2)] text-[var(--os-text-primary)] border-[var(--material-card-border)] shadow-[var(--os-shadow-xs)] hover:bg-[var(--os-surface-3)]',
};

const SIZE_CLASSES = {
  xs: 'min-h-[30px] px-2.5 py-1 text-xs rounded-[var(--radius-xs)] gap-1.5',
  sm: 'min-h-[34px] px-3 py-1.5 text-xs rounded-[var(--radius-sm)] gap-2',
  md: 'min-h-[40px] px-4 py-2 text-sm rounded-[var(--radius-md)] gap-2',
  lg: 'min-h-[46px] px-5 py-2.5 text-sm sm:text-base rounded-[var(--radius-md)] gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel = 'Đang xử lý',
  icon,
  iconLeft,
  trailingIcon,
  iconRight,
  type = 'button',
  className = '',
  disabled = false,
  onClick,
  children,
  ...rest
}) {
  const isDisabled = disabled || loading;
  const leadingIcon = icon || iconLeft;
  const endIcon = trailingIcon || iconRight;

  return (
    <>
      <button
        {...rest}
        type={type}
        disabled={disabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        className={`os-focus-ring relative inline-flex items-center justify-center border font-semibold tracking-[-0.01em] select-none cursor-pointer transition-[background-color,border-color,color,transform,box-shadow] duration-[var(--dur-micro)] ease-[var(--ease-os-out)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
          VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary
        } ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`}
      >
        <span
          className={`inline-flex items-center justify-center gap-[inherit] ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {leadingIcon && (
            <span className="inline-flex shrink-0 items-center" aria-hidden="true">
              {leadingIcon}
            </span>
          )}
          {children && <span className="truncate">{children}</span>}
          {endIcon && (
            <span className="inline-flex shrink-0 items-center" aria-hidden="true">
              {endIcon}
            </span>
          )}
        </span>

        {loading && (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <Loader2 size={size === 'lg' ? 18 : 15} className="animate-spin" />
          </span>
        )}
      </button>
      {loading && (
        <span className="sr-only" role="status">
          {loadingLabel}
        </span>
      )}
    </>
  );
}
