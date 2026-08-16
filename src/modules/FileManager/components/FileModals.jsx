// src/modules/FileManager/components/FileModals.jsx
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, AlertTriangle, Link as LinkIcon, X, Music, Globe } from 'lucide-react';

export default function FileModals({
  showFolderModal, setShowFolderModal, folderName, setFolderName, handleCreateFolder,
  showLinkModal, setShowLinkModal, linkInput, setLinkInput, handleAddLink,
  fileToDelete, setFileToDelete, confirmDelete,
  previewFile, setPreviewFile, viewerEngine, setViewerEngine
}) {
  return (
    <>
      {/* --- MODAL TẠO THƯ MỤC --- */}
      {createPortal(
        <AnimatePresence>
          {showFolderModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={() => setShowFolderModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }} transition={{ type: 'spring', stiffness: 380, damping: 28 }} className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100"><FolderPlus size={24} className="text-amber-500"/> Tạo thư mục mới</h3>
                <form onSubmit={handleCreateFolder}>
                  <input type="text" autoFocus value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Nhập tên..." className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-amber-500 mb-6" required />
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowFolderModal(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium">Hủy</button>
                    <button type="submit" className="px-5 py-2.5 bg-amber-500 text-black rounded-xl font-medium">Tạo</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* --- MODAL XÁC NHẬN XÓA --- */}
      {createPortal(
        <AnimatePresence>
          {fileToDelete && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={() => setFileToDelete(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }} transition={{ type: 'spring', stiffness: 380, damping: 28 }} className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-sm text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Xác nhận xóa</h3>
                <p className="text-slate-500 mb-6">Xóa <span className="font-semibold text-slate-700 dark:text-slate-300">{fileToDelete.name}</span>?</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setFileToDelete(null)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium">Hủy</button>
                  <button onClick={confirmDelete} className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium">Xóa</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* --- MODAL XEM TRƯỚC (PREVIEW) --- */}
      {createPortal(
        <AnimatePresence>
          {previewFile && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={() => setPreviewFile(null)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm cursor-pointer" />
              <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 4 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }} className="relative bg-white dark:bg-black w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <h3 className="font-medium text-slate-800 dark:text-slate-200 pr-4 flex items-center gap-3"><LinkIcon size={18} className="text-amber-500" /><span className="truncate">{previewFile.name}</span></h3>
                  <div className="flex gap-2 shrink-0 items-center">
                    <a href={previewFile.url} target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-amber-500 text-black rounded-lg">Mở trực tiếp</a>
                    <button onClick={() => setPreviewFile(null)} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"><X size={20} /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-100 dark:bg-black p-4 relative">
                  {previewFile.type === 'image' && <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-lg" />}
                  {previewFile.type === 'video' && <video src={previewFile.url} controls autoPlay className="max-w-full max-h-full rounded-lg" />}
                  {previewFile.type === 'audio' && (
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg flex flex-col items-center gap-6">
                      <Music size={64} className="text-pink-500 animate-pulse" />
                      <audio src={previewFile.url} controls autoPlay className="w-72" />
                    </div>
                  )}
                  {previewFile.type === 'document' && (
                    <div className="w-full h-full bg-white rounded-lg flex flex-col relative">
                      {!previewFile.url.toLowerCase().includes('.pdf') && (
                        <div className="absolute top-2 left-2 z-10 flex bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-1">
                           <button onClick={() => setViewerEngine('microsoft')} className={`px-3 py-1.5 text-xs font-medium rounded-md ${viewerEngine === 'microsoft' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>Microsoft</button>
                           <button onClick={() => setViewerEngine('google')} className={`px-3 py-1.5 text-xs font-medium rounded-md ${viewerEngine === 'google' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>Google</button>
                        </div>
                      )}
                      {previewFile.url.toLowerCase().includes('.pdf') ? (
                        <iframe src={previewFile.url} className="w-full h-full border-0" />
                      ) : (
                        viewerEngine === 'microsoft' ? <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewFile.url)}`} className="w-full h-full border-0 pt-12" /> : <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(previewFile.url)}&embedded=true`} className="w-full h-full border-0 pt-12 bg-slate-50" />
                      )}
                    </div>
                  )}
                  {previewFile.type === 'raw' && (
                    <div className="text-center"><Globe size={64} className="mx-auto text-slate-400 mb-4" /><a href={previewFile.url} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl">Truy cập trực tiếp</a></div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
      {createPortal(
        <AnimatePresence>
          {showLinkModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLinkModal(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }} className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-black">
                <h3 className="mb-4 text-xl font-bold text-slate-800 dark:text-white">Dán liên kết mới</h3>
                <form onSubmit={handleAddLink}>
                  <input type="url" autoFocus value={linkInput} onChange={(event) => setLinkInput(event.target.value)} placeholder="https://example.com/file.pdf" className="mb-6 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" required />
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setShowLinkModal(false)} className="rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300">Hủy</button>
                    <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white">Lưu liên kết</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
