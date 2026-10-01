import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, ExternalLink, File, Folder, Share2, X } from 'lucide-react';

export default function ShareDialog({ item, url, onClose, onCopy, onShare }) {
  useEffect(() => {
    if (!item) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const isFolder = item.type === 'folder';
  const ItemIcon = isFolder ? Folder : File;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.button
          type="button"
          aria-label="Đóng hộp thoại chia sẻ"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 border-0 bg-black/70 backdrop-blur-sm"
        />
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-dialog-title"
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          className="relative z-10 w-full max-w-md rounded-xl border border-slate-700 bg-[#101319] p-5 text-slate-100 shadow-2xl sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-300">
                <ItemIcon size={21} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chia sẻ {isFolder ? 'thư mục' : 'tệp'}</p>
                <h2 id="share-dialog-title" className="truncate font-semibold text-white">{item.name}</h2>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-md p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <label htmlFor="share-link" className="mt-5 block text-sm font-medium text-slate-300">Liên kết truy cập trực tiếp</label>
          <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-slate-700 bg-black/30 p-2">
            <input id="share-link" readOnly value={url} onFocus={(event) => event.currentTarget.select()} className="min-w-0 flex-1 bg-transparent px-1 text-sm text-slate-300 outline-none" />
            <button type="button" onClick={onCopy} title="Sao chép liên kết" aria-label="Sao chép liên kết" className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-amber-300 transition hover:bg-amber-400/10">
              <Copy size={17} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={onShare} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-400 px-3 text-sm font-bold text-black transition hover:bg-amber-300">
              <Share2 size={17} /> Chia sẻ
            </button>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5">
              <ExternalLink size={16} /> Mở thử
            </a>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-400">
            <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
            Người nhận mở link sẽ được đưa thẳng đến {isFolder ? 'thư mục này' : 'bản xem trước của tệp'} trong WindHub.
          </p>
        </motion.section>
      </div>
    </AnimatePresence>,
    document.body,
  );
}