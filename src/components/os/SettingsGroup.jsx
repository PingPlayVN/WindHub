export default function SettingsGroup({ title, description, icon, badge, children, className = '' }) {
  return (
    <section className={`os-card overflow-hidden p-0 ${className}`}>
      {(title || description) && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--os-border-subtle)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {icon && (
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--os-accent-soft)] text-[var(--os-accent)] border border-[var(--os-accent-border)]"
              >
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm sm:text-base font-bold text-[var(--os-text-primary)]">
                  {title}
                </h2>
                {badge && (
                  <span className="rounded-full bg-[var(--os-accent-soft)] border border-[var(--os-accent-border)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--os-accent)]">
                    {badge}
                  </span>
                )}
              </div>
              {description && (
                <p className="mt-0.5 text-xs text-[var(--os-text-muted)] leading-relaxed">{description}</p>
              )}
            </div>
          </div>
        </header>
      )}
      <div className="divide-y divide-[var(--os-border-subtle)]">{children}</div>
    </section>
  );
}
