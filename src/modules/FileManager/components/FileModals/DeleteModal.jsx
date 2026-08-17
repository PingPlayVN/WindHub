import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function DeleteModal({ fileToDelete, setFileToDelete, confirmDelete }) {
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 15 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.4, bounce: 0.3 } },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15 } }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFileToDelete(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0" />
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative w-full max-w-sm bg-[#0a0a0a] border border-red-500/30 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.15)] p-6 z-10 text-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Xác nhận xóa?</h3>
        <p className="text-slate-400 mb-6 text-sm">Bạn có chắc muốn xóa <span className="text-white font-semibold truncate block max-w-full mt-1">"{fileToDelete.name}"</span> Hành động này không thể hoàn tác.</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => setFileToDelete(null)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors font-medium">Hủy bỏ</button>
          <button onClick={confirmDelete} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-600/20">Xóa vĩnh viễn</button>
        </div>
      </motion.div>
    </div>
  );
}
