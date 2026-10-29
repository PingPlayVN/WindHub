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
        <motion.div key="online" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-full">
          {children}
        </motion.div>
      ) : (
        <motion.div key="offline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-black/65 p-4 backdrop-blur-sm">
          <div className="pointer-events-none absolute inset-4 opacity-40">
            <OfflineAsciiSkeleton variant="terminal" />
          </div>
          <motion.section
            role="status"
            aria-live="polite"
            aria-labelledby="offline-title"
            aria-describedby="offline-description"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative z-10 w-full max-w-sm rounded-xl border border-slate-700 bg-[#101319] p-6 text-center shadow-2xl"
          >
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300">
                <WifiOff size={22} />
              </span>
              <h2 id="offline-title" className="mt-4 text-lg font-bold text-slate-100">Cần kết nối Internet</h2>
              <p id="offline-description" className="mt-2 text-sm leading-6 text-slate-400">
                Tab {pageTitle} cần mạng để tải dữ liệu. Hãy bật Wi-Fi hoặc dữ liệu di động; trang sẽ tự hoạt động lại khi có kết nối.
              </p>
              <div className="mx-auto mt-5 flex w-fit items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-300/80">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" /> Đang chờ kết nối
              </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}