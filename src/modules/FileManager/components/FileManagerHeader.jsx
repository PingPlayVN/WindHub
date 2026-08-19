import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardPaste } from 'lucide-react';

export default function FileManagerHeader({ clipboard, handlePaste }) {
  return (
    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 gap-4 z-10">
      <div className="shrink-0">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quản lý tài nguyên</h2>
      </div>
      <div className="flex w-full xl:w-auto flex-col sm:flex-row gap-3">
        <AnimatePresence>
          {clipboard && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0, width: 0 }}
              animate={{ scale: 1, opacity: 1, width: 'auto' }}
              exit={{ scale: 0.8, opacity: 0, width: 0 }}
              onClick={handlePaste}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-medium hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <ClipboardPaste size={18} /> Dán {clipboard.action === 'copy' ? '(Bản sao)' : '(Di chuyển)'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}