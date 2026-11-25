import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { OfflineAsciiSkeleton } from '@/components/ui/AsciiReveal';

export default function OfflineGate({ pageTitle, children }) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isOnline ? (
        <motion.div key="online" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-full h-full">
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="offline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-[var(--os-backdrop)] p-4 backdrop-blur-md"
        >
          <div className="pointer-events-none absolute inset-4 opacity-30">
            <OfflineAsciiSkeleton variant="terminal" />
          </div>
          <motion.section
            role="status"
            aria-live="polite"
            aria-labelledby="offline-title"
            aria-describedby="offline-description"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="os-floating-surface relative z-10 w-full max-w-sm rounded-[var(--radius-xl)] p-6 text-center"
          >
            <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-[var(--os-warning-border)] bg-[var(--os-warning-soft)] text-[var(--os-warning)]">
              <WifiOff size={22} />
            </span>
            <h2 id="offline-title" className="mt-4 text-lg font-bold text-[var(--os-text-primary)]">
              Cần kết nối Internet
            </h2>
            <p id="offline-description" className="mt-2 text-sm leading-6 text-[var(--os-text-secondary)]">
              Không gian <strong>{pageTitle}</strong> cần mạng để đồng bộ dữ liệu. Bật Wi-Fi hoặc dữ liệu di động để tự động kết nối lại.
            </p>
            <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-[var(--os-warning-soft)] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--os-warning)]">
              <span className="size-2 animate-pulse rounded-full bg-[var(--os-warning)]" /> Đang chờ mạng
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
