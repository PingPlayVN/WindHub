import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Tìm kiếm...',
  shortcut,
  ariaLabel = 'Tìm kiếm',
  size = 'md',
  className = '',
  inputRef,
  ...rest
}) {
  const heightClass = size === 'sm' ? 'h-9 text-xs' : size === 'lg' ? 'h-12 text-base' : 'h-10.5 text-sm';

  return (
    <div className={`relative flex items-center w-full min-w-0 ${className}`}>
      <Search
        size={size === 'sm' ? 15 : 17}
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 text-[var(--os-text-muted)] shrink-0"
      />
      <input
        {...rest}
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`os-focus-ring w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] pl-10 pr-16 text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] transition-[border-color,background-color,box-shadow] duration-[var(--dur-micro)] focus:border-[var(--os-accent)] focus:bg-[var(--os-surface-1)] ${heightClass}`}
      />
      <div className="absolute right-2.5 flex items-center gap-1">
        {value ? (
          <button
            type="button"
            onClick={() => {
              if (onClear) onClear();
              else onChange?.('');
            }}
            aria-label="Xóa nội dung tìm kiếm"
            className="os-focus-ring flex size-6 items-center justify-center rounded-full text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)] cursor-pointer"
          >
            <X size={14} />
          </button>
        ) : (
          shortcut && (
            <kbd className="pointer-events-none hidden sm:inline-flex items-center gap-0.5 rounded-[var(--radius-xs)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--os-text-muted)]">
              {shortcut}
            </kbd>
          )
        )}
      </div>
    </div>
  );
}
