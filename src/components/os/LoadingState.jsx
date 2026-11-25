import { motion } from 'framer-motion';

export default function LoadingState({
  label = 'Đang tải dữ liệu...',
  fullScreen = false,
  size = 'md',
}) {
  const dim = size === 'sm' ? 'size-6 border-2' : size === 'lg' ? 'size-12 border-[3.5px]' : 'size-9 border-[3px]';

  const content = (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3.5">
      <div className="relative flex items-center justify-center">
        <span className={`rounded-full border-[var(--os-border-default)] ${dim}`} />
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
          className={`absolute inset-0 rounded-full border-transparent border-t-[var(--os-accent)] border-r-[var(--os-accent)] ${dim}`}
        />
      </div>
      {label && (
        <p className="text-xs sm:text-sm font-medium text-[var(--os-text-muted)] tracking-tight">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[var(--z-toast)] flex items-center justify-center bg-[var(--os-bg)]/85 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return <div className="flex min-h-[200px] w-full flex-1 items-center justify-center p-6">{content}</div>;
}
