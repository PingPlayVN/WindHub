import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ExternalLink, X } from 'lucide-react';
import PreviewContent from '../Preview/PreviewContent';

export default function PreviewModal({ previewFile, setPreviewFile, viewerEngine, setViewerEngine }) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setPreviewFile(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [setPreviewFile]);

  if (!previewFile) return null;
  const { url, name, isLocked } = previewFile;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewFile(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }} className="relative z-10 flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-primary-500/20 bg-[#0a0a0a] shadow-[0_0_50px_rgba(234,88,12,0.1)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-[#0f0f0f] px-5 py-3">
          <h3 className="truncate pr-4 text-base font-semibold text-white">{name}</h3>
          <div className="flex shrink-0 items-center gap-2">
            {!isLocked && <a href={url} target="_blank" rel="noreferrer" className="rounded-xl p-2 text-slate-400 transition-all hover:bg-primary-500/10 hover:text-primary-500" title="Mở trong thẻ mới"><ExternalLink size={20} /></a>}
            <button type="button" onClick={() => setPreviewFile(null)} className="ml-1 rounded-xl p-2 text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-500" title="Đóng (Esc)"><X size={20} /></button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
          <PreviewContent previewFile={previewFile} viewerEngine={viewerEngine} setViewerEngine={setViewerEngine} />
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
