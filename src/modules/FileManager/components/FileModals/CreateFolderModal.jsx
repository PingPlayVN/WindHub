import { motion } from 'framer-motion';
import { FolderPlus } from 'lucide-react';

export default function CreateFolderModal({ setShowFolderModal, folderName, setFolderName, handleCreateFolder }) {
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 15 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.4, bounce: 0.3 } },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15 } }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFolderModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0" />
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative w-full max-w-sm bg-[#0a0a0a] border border-primary-500/30 rounded-2xl shadow-[0_0_40px_rgba(234,88,12,0.15)] p-6 z-10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FolderPlus className="text-primary-500"/> Tạo thư mục mới</h3>
        <form onSubmit={handleCreateFolder}>
          <input autoFocus type="text" value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Nhập tên thư mục..." className="w-full bg-[#111] border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all mb-6 placeholder:text-slate-600" />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowFolderModal(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors font-medium">Hủy</button>
            <button type="submit" disabled={!folderName.trim()} className="px-5 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary-600/20">Tạo mới</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
