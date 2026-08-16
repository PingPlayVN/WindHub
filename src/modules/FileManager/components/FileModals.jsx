import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, FolderPlus, ExternalLink, FileText, Music, Link as LinkIcon } from 'lucide-react';

export default function FileModals({
  showFolderModal, setShowFolderModal, folderName, setFolderName, handleCreateFolder,
  showLinkModal, setShowLinkModal, linkInput, setLinkInput, handleAddLink,
  fileToDelete, setFileToDelete, confirmDelete,
  previewFile, setPreviewFile, viewerEngine, setViewerEngine
}) {
  
  // Hiệu ứng phông nền tối mờ ảo
  const Overlay = ({ onClick }) => (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      onClick={onClick} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0"
    />
  );

  // Hiệu ứng Pop-up bật nảy cho các cửa sổ
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 15 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.4, bounce: 0.3 } },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15 } }
  };

  // Hàm render giao diện xem trước linh hoạt theo loại file
  const renderPreviewContent = () => {
    if (!previewFile) return null;
    const { type, url, name, isLocked } = previewFile;

    switch (type) {
      case 'image':
        return <img src={url} alt={name} className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]" />;
      case 'video':
        return <video src={url} controls autoPlay className="max-w-full max-h-[75vh] rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] outline-none w-full bg-black" />;
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-[#111] rounded-2xl border border-white/5 w-full max-w-md shadow-2xl">
            <div className="w-24 h-24 bg-primary-500/20 text-primary-500 rounded-full flex items-center justify-center mb-8 animate-pulse shadow-[0_0_20px_rgba(234,88,12,0.3)]">
              <Music size={48} />
            </div>
            <audio src={url} controls autoPlay className="w-full outline-none" />
          </div>
        );
      case 'document':
        const viewerUrl = viewerEngine === 'google'
          ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
          : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
        return (
          <div className="w-full h-[75vh] flex flex-col">
            <div className="flex gap-2 mb-3 justify-end">
              <button onClick={() => setViewerEngine('microsoft')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewerEngine === 'microsoft' ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Microsoft Viewer</button>
              <button onClick={() => setViewerEngine('google')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewerEngine === 'google' ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Google Viewer</button>
            </div>
            <iframe src={viewerUrl} className="w-full flex-1 bg-white rounded-xl shadow-inner border-0" title="Document Preview" />
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-[#111] rounded-2xl border border-white/5 w-full max-w-md">
            <FileText size={64} className="text-slate-600 mb-4" />
            <p className="text-slate-400 mb-6 text-center text-sm">Không thể xem trước tệp tin này trực tiếp.<br/>Vui lòng mở trong thẻ mới để truy cập.</p>
            
            {/* ĐIỀU KIỆN CHẶN NÚT MỞ TỆP LỚN Ở ĐÂY */}
            {!isLocked && (
              <a href={url} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-primary-600 text-white rounded-xl flex items-center gap-2 hover:bg-primary-500 transition-colors shadow-lg shadow-primary-600/20 font-medium">
                <ExternalLink size={18} /> Mở tệp tin
              </a>
            )}
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {/* 1. MODAL TẠO THƯ MỤC */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Overlay onClick={() => setShowFolderModal(false)} />
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
      )}

      {/* 2. MODAL XÓA FILE */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Overlay onClick={() => setFileToDelete(null)} />
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
      )}

      {/* 3. MODAL PREVIEW FILE */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
          <Overlay onClick={() => setPreviewFile(null)} />
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative w-full max-w-5xl max-h-full bg-[#0a0a0a] border border-primary-500/20 rounded-2xl shadow-[0_0_50px_rgba(234,88,12,0.1)] z-10 flex flex-col overflow-hidden">
            
            {/* Header của cửa sổ Preview */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0f0f0f]">
              <h3 className="text-base font-semibold text-white truncate pr-4 drop-shadow-md">
                {previewFile.name}
              </h3>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                
                {/* ĐIỀU KIỆN CHẶN NÚT MỞ THẺ MỚI NHỎ Ở ĐÂY NỮA */}
                {!previewFile.isLocked && (
                  <a href={previewFile.url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-xl transition-all" title="Mở trong thẻ mới">
                    <ExternalLink size={20} />
                  </a>
                )}
                
                <button onClick={() => setPreviewFile(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all ml-1" title="Đóng (Esc)">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Nội dung Preview */}
            <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-2 sm:p-6 min-h-[40vh]">
              {renderPreviewContent()}
            </div>
          </motion.div>
        </div>
      )}

      {/* 4. MODAL DÁN LINK */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Overlay onClick={() => setShowLinkModal(false)} />
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative w-full max-w-sm bg-[#0a0a0a] border border-blue-500/30 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.15)] p-6 z-10">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><LinkIcon className="text-blue-500"/> Dán liên kết file</h3>
            <form onSubmit={handleAddLink}>
              <input autoFocus type="url" value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="Nhập đường dẫn (https://...)" className="w-full bg-[#111] border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all mb-6 placeholder:text-slate-600" required />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowLinkModal(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors font-medium">Hủy</button>
                <button type="submit" disabled={!linkInput.trim()} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20">Lưu file</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}