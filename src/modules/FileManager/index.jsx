// src/modules/FileManager/index.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  File as FileIcon, Image as ImageIcon, Video, X, Eye, Trash2, 
  Link as LinkIcon, FileText, Globe, AlertTriangle, Music, 
  Folder as FolderIcon, FolderPlus, ChevronRight, CornerUpLeft,
  Copy, Scissors, ClipboardPaste, Edit2, MoreVertical
} from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/services/firebase';

export default function FileManager() {
  const [allFiles, setAllFiles] = useState([]);
  const [currentFiles, setCurrentFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState({ id: 'root', name: 'Trang chủ' });
  const [path, setPath] = useState([{ id: 'root', name: 'Trang chủ' }]);
  
  const [previewFile, setPreviewFile] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [viewerEngine, setViewerEngine] = useState('microsoft');

  // --- CÁC STATE CHO TÍNH NĂNG WINDOWS (Context Menu, Copy, Paste, Rename) ---
  const [contextMenu, setContextMenu] = useState(null);
  const [clipboard, setClipboard] = useState(null); // { action: 'copy' | 'cut', item: fileObject }
  const [renamingItem, setRenamingItem] = useState(null);
  const [renameText, setRenameText] = useState('');

  // 1. Tải dữ liệu
  useEffect(() => {
    const q = query(collection(db, 'windhub_files'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllFiles(filesData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered = allFiles.filter(f => (f.parentId || 'root') === currentFolder.id);
    filtered.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
    setCurrentFiles(filtered);
  }, [allFiles, currentFolder.id]);

  // 2. Đóng Context Menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const detectFileType = (url) => {
    try {
      const ext = url.split('.').pop().toLowerCase().split('?')[0];
      const images = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
      const videos = ['mp4', 'webm', 'ogg', 'mov'];
      const audios = ['mp3', 'wav', 'flac'];
      const docs = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv'];
      if (images.includes(ext)) return 'image';
      if (videos.includes(ext)) return 'video';
      if (audios.includes(ext)) return 'audio';
      if (docs.includes(ext)) return 'document';
      return 'raw';
    } catch { return 'raw'; }
  };

  // 3. Các thao tác Thêm, Tạo, Xóa
  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkInput.trim()) return;
    setIsAdding(true);
    const type = detectFileType(linkInput);
    let name = linkInput.split('/').pop().split('?')[0] || ('Tài_nguyên_' + Math.floor(Math.random() * 1000));
    try {
      await addDoc(collection(db, 'windhub_files'), {
        name: decodeURIComponent(name), url: linkInput, type, parentId: currentFolder.id,
        createdAt: new Date().toLocaleDateString('vi-VN'), timestamp: Date.now()
      });
      setLinkInput('');
    } catch (error) { console.error("Lỗi:", error); } finally { setIsAdding(false); }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    try {
      await addDoc(collection(db, 'windhub_files'), {
        name: folderName, type: 'folder', parentId: currentFolder.id,
        createdAt: new Date().toLocaleDateString('vi-VN'), timestamp: Date.now()
      });
      setFolderName(''); setShowFolderModal(false);
    } catch (error) { console.error("Lỗi:", error); }
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      await deleteDoc(doc(db, 'windhub_files', fileToDelete.id));
    } catch (error) { console.error("Lỗi xóa:", error); } finally { setFileToDelete(null); }
  };

  // 4. Các thao tác COPY / CUT / PASTE / RENAME
  const handleContextMenu = (e, item) => {
    e.preventDefault(); // Chặn menu chuột phải mặc định
    // Đảm bảo menu không bị tràn màn hình (cơ bản)
    let x = e.clientX; let y = e.clientY;
    if (window.innerWidth - x < 200) x -= 180;
    if (window.innerHeight - y < 250) y -= 200;
    
    setContextMenu({ x, y, item });
  };

  const handleCopy = (item) => setClipboard({ action: 'copy', item });
  const handleCut = (item) => setClipboard({ action: 'cut', item });

  const handlePaste = async () => {
    if (!clipboard) return;
    try {
      if (clipboard.action === 'cut') {
        // Cut -> Cập nhật parentId của file/thư mục cũ thành thư mục hiện tại
        await updateDoc(doc(db, 'windhub_files', clipboard.item.id), { parentId: currentFolder.id });
        setClipboard(null); // Paste xong thì xóa clipboard
      } else if (clipboard.action === 'copy') {
        // Copy -> Tạo file mới y hệt, thêm chữ "- Copy"
        const { id, ...dataToCopy } = clipboard.item;
        await addDoc(collection(db, 'windhub_files'), {
          ...dataToCopy,
          name: dataToCopy.name + ' - Copy',
          parentId: currentFolder.id,
          timestamp: Date.now()
        });
      }
    } catch (error) { console.error("Lỗi Paste:", error); }
  };

  const startRename = (item) => {
    setRenamingItem(item.id);
    setRenameText(item.name);
  };

  const handleRenameSubmit = async (e, id) => {
    e.preventDefault();
    if (!renameText.trim()) { setRenamingItem(null); return; }
    try {
      await updateDoc(doc(db, 'windhub_files', id), { name: renameText });
    } catch (error) { console.error("Lỗi Rename:", error); }
    setRenamingItem(null);
  };

  // 5. Điều hướng
  const handleOpenFolder = (folder) => {
    setCurrentFolder({ id: folder.id, name: folder.name });
    setPath([...path, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateTo = (index) => {
    const newPath = path.slice(0, index + 1);
    setPath(newPath);
    setCurrentFolder(newPath[newPath.length - 1]);
  };

  const getFileIcon = (type) => {
    if (type === 'folder') return <FolderIcon size={40} className="text-blue-500 fill-blue-500/20" />;
    if (type === 'image') return <ImageIcon size={32} className="text-blue-500" />;
    if (type === 'video') return <Video size={32} className="text-purple-500" />;
    if (type === 'audio') return <Music size={32} className="text-pink-500" />;
    if (type === 'document') return <FileText size={32} className="text-orange-500" />;
    return <Globe size={32} className="text-slate-500" />;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col gap-4 relative">
      
      {/* Header & Công cụ */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 gap-4 z-10">
        <div className="shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quản lý Tài nguyên</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Chuột phải vào file để Copy/Paste/Đổi tên</p>
        </div>
        
        <div className="flex w-full xl:w-auto flex-col sm:flex-row gap-3">
          
          {/* Nút Paste (Chỉ hiện khi có dữ liệu trong Clipboard) */}
          {clipboard && (
            <motion.button 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={handlePaste}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-medium hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <ClipboardPaste size={18} /> Dán {clipboard.action === 'copy' ? '(Bản sao)' : '(Di chuyển)'}
            </motion.button>
          )}

          <button onClick={() => setShowFolderModal(true)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
            <FolderPlus size={18} /> Tạo Thư mục
          </button>

          <form onSubmit={handleAddLink} className="flex flex-1 sm:w-80 relative shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LinkIcon size={16} className="text-slate-400" /></div>
            <input 
              type="url" value={linkInput} onChange={(e) => setLinkInput(e.target.value)}
              placeholder="Dán link vào đây..." 
              className="pl-10 pr-4 py-2 w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200 text-sm"
              required disabled={isAdding}
            />
            <button type="submit" disabled={isAdding} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-xl font-medium transition-colors text-sm">Lưu</button>
          </form>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-2 text-sm text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-nowrap custom-scrollbar pb-1">
        {path.length > 1 && (
          <button onClick={() => handleNavigateTo(path.length - 2)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors mr-1">
             <CornerUpLeft size={16} />
          </button>
        )}
        {path.map((p, idx) => (
          <React.Fragment key={p.id}>
            <button onClick={() => handleNavigateTo(idx)} className={`hover:text-blue-600 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 ${idx === path.length - 1 ? 'font-bold text-slate-800 dark:text-slate-200' : ''}`}>
              {p.name}
            </button>
            {idx < path.length - 1 && <ChevronRight size={16} className="text-slate-400" />}
          </React.Fragment>
        ))}
      </div>

      {/* Lưới hiển thị */}
      <div 
        className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 overflow-y-auto custom-scrollbar"
        onContextMenu={(e) => { e.preventDefault(); /* Chặn chuột phải ở vùng trống nếu muốn */ }}
      >
        {currentFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <FolderIcon size={64} className="mb-4 opacity-30" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Thư mục trống</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            <AnimatePresence>
              {currentFiles.map((file) => (
                <motion.div 
                  key={file.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} 
                  className={`group relative bg-slate-50 dark:bg-slate-800/50 border ${renamingItem === file.id ? 'border-blue-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl p-4 flex flex-col items-center gap-3 hover:shadow-md hover:border-blue-300 transition-all select-none`}
                  onContextMenu={(e) => handleContextMenu(e, file)} // Bắt sự kiện chuột phải
                >
                  
                  {/* Nút 3 chấm cho Mobile (Hover trên Desktop) */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 dark:bg-slate-900/90 p-1 rounded-lg shadow-sm z-10">
                    <button 
                      onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation(); // THÊM DÒNG NÀY: Chặn sự kiện click truyền lên window
                      handleContextMenu(e, file);
                    }} 
                      className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  
                  <div 
                    onClick={() => {
                      if(renamingItem === file.id) return;
                      file.type === 'folder' ? handleOpenFolder(file) : setPreviewFile(file);
                    }}
                    className={`w-full aspect-square flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden ${file.type === 'folder' ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'cursor-default'}`}
                  >
                    {file.type === 'image' ? <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" /> : getFileIcon(file.type)}
                  </div>
                  
                  <div className="w-full text-center">
                    {renamingItem === file.id ? (
                      <form onSubmit={(e) => handleRenameSubmit(e, file.id)}>
                        <input 
                          autoFocus type="text" value={renameText} onChange={e => setRenameText(e.target.value)}
                          onBlur={(e) => handleRenameSubmit(e, file.id)}
                          className="w-full text-sm font-medium text-center bg-white dark:bg-slate-900 border border-blue-500 rounded px-1 py-0.5 focus:outline-none"
                        />
                      </form>
                    ) : (
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate px-1" title={file.name}>{file.name}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* --- CỬA SỔ CONTEXT MENU (CHUỘT PHẢI) NỔI TRÊN CÙNG --- */}
      {contextMenu && createPortal(
        <div 
          className="fixed z-[200] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 w-48 overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()} // Chống đóng menu khi click vào chính nó
        >
          {contextMenu.item.type !== 'folder' && (
            <button onClick={() => { setPreviewFile(contextMenu.item); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3">
              <Eye size={16} /> Xem trước
            </button>
          )}
          <button onClick={() => { startRename(contextMenu.item); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3">
            <Edit2 size={16} /> Đổi tên
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
          <button onClick={() => { handleCopy(contextMenu.item); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3">
            <Copy size={16} /> Sao chép
          </button>
          <button onClick={() => { handleCut(contextMenu.item); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3">
            <Scissors size={16} /> Cắt (Di chuyển)
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
          <button onClick={() => { setFileToDelete(contextMenu.item); setContextMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3">
            <Trash2 size={16} /> Xóa
          </button>
        </div>,
        document.body
      )}

      {/* PORTAL MODAL TẠO THƯ MỤC, MODAL XÓA VÀ PREVIEW ĐƯỢC RÚT GỌN (Giữ logic cũ) */}
      {/* -------------------------------------------------------------------------------- */}
      {createPortal(
        <AnimatePresence>
          {showFolderModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFolderModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FolderPlus size={24} className="text-blue-500"/> Tạo thư mục mới</h3>
                <form onSubmit={handleCreateFolder}>
                  <input type="text" autoFocus value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Nhập tên..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-blue-500 mb-6" required />
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowFolderModal(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium">Hủy</button>
                    <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium">Tạo</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {fileToDelete && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFileToDelete(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-sm text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
                <h3 className="text-xl font-bold mb-2">Xác nhận xóa</h3>
                <p className="text-slate-500 mb-6">Xóa <span className="font-semibold">{fileToDelete.name}</span>?</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setFileToDelete(null)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium">Hủy</button>
                  <button onClick={confirmDelete} className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium">Xóa</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {previewFile && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewFile(null)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm cursor-pointer" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <h3 className="font-medium pr-4 flex items-center gap-3"><LinkIcon size={18} className="text-blue-500" /><span className="truncate">{previewFile.name}</span></h3>
                  <div className="flex gap-2 shrink-0 items-center">
                    <a href={previewFile.url} target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg">Mở trực tiếp</a>
                    <button onClick={() => setPreviewFile(null)} className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg"><X size={20} /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-100 dark:bg-black p-4 relative">
                  {previewFile.type === 'image' && <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-lg" />}
                  {previewFile.type === 'video' && <video src={previewFile.url} controls autoPlay className="max-w-full max-h-full rounded-lg" />}
                  {previewFile.type === 'audio' && <audio src={previewFile.url} controls autoPlay className="w-72" />}
                  {previewFile.type === 'document' && (
                    <div className="w-full h-full bg-white rounded-lg flex flex-col relative">
                      {!previewFile.url.toLowerCase().includes('.pdf') && (
                        <div className="absolute top-2 left-2 z-10 flex bg-white dark:bg-slate-800 rounded-lg shadow-md border p-1">
                           <button onClick={() => setViewerEngine('microsoft')} className={`px-3 py-1.5 text-xs font-medium rounded-md ${viewerEngine === 'microsoft' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}>Microsoft</button>
                           <button onClick={() => setViewerEngine('google')} className={`px-3 py-1.5 text-xs font-medium rounded-md ${viewerEngine === 'google' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}>Google</button>
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
    </motion.div>
  );
}