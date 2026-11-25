export default function Skeleton({ className = 'h-4 w-full', rounded = 'md' }) {
  const radiusClass =
    rounded === 'full'
      ? 'rounded-full'
      : rounded === 'xl'
      ? 'rounded-[var(--radius-xl)]'
      : rounded === 'lg'
      ? 'rounded-[var(--radius-lg)]'
      : 'rounded-[var(--radius-sm)]';

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-[var(--os-surface-3)] ${radiusClass} ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/8 to-transparent"
        style={{ animation: 'os-shimmer 1.6s ease-in-out infinite' }}
      />
    </div>
  );
}
