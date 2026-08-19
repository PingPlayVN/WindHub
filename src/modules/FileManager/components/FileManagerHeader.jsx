import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, Link as LinkIcon, ClipboardPaste } from 'lucide-react';

export default function FileManagerHeader({
  isAdmin, clipboard, handlePaste, setShowFolderModal,
  handleAddLink, linkInput, setLinkInput, isAdding
}) {
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
        <button disabled={!isAdmin} onClick={() => setShowFolderModal(true)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50">
          <FolderPlus size={18} /> Tạo Thư Mục
        </button>
        <form onSubmit={handleAddLink} className="flex flex-1 sm:w-80 relative shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LinkIcon size={16} className="text-slate-400" /></div>
          <input type="url" value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="Dán link vào đây..." className="pl-10 pr-4 py-2 w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" required disabled={isAdding} />
          <button type="submit" disabled={isAdding} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-r-xl font-medium transition-colors text-sm">Lưu</button>
        </form>
      </div>
    </div>
  );
}