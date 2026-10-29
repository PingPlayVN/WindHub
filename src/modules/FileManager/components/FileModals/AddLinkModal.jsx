import { motion } from 'framer-motion';
import { Link as LinkIcon } from 'lucide-react';

const Overlay = ({ onClick }) => <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClick} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0" />;

export default function AddLinkModal({ setShowLinkModal, linkInput, setLinkInput, handleAddLink, isCreating }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <Overlay onClick={() => setShowLinkModal(false)} />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ type: 'spring', duration: 0.4 }} className="relative w-full max-w-sm bg-[#0a0a0a] border border-primary-500/30 rounded-2xl shadow-[0_0_40px_rgba(234,88,12,0.15)] p-6 z-10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><LinkIcon className="text-primary-500"/> Dán liên kết file</h3>
        <form onSubmit={handleAddLink}>
          <input autoFocus type="url" value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="Nhập đường dẫn (https://...)" className="w-full bg-[#111] border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all mb-6 placeholder:text-slate-600" required />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowLinkModal(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors font-medium">Hủy</button>
            <button type="submit" disabled={!linkInput.trim() || isCreating} className="px-5 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary-600/20">{isCreating ? 'Đang lưu...' : 'Lưu file'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
