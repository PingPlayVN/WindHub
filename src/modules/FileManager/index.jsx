// src/modules/FileManager/index.jsx
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, Video, Globe, Music, 
  Folder as FolderIcon, FolderPlus, Link as LinkIcon, FileText, ClipboardPaste, MoreVertical, LockKeyhole
} from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/services/firebase';
import ContextMenu from './components/ContextMenu';
import Breadcrumb from './components/Breadcrumb';
import FileModals from './components/FileModals/index.jsx';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

export default function FileManager() {
  const { isAdmin } = useAuthStore();
  const [allFiles, setAllFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState({ id: 'root', name: 'Trang chủ' });
  const [path, setPath] = useState([{ id: 'root', name: 'Trang chủ' }]);
  
  const [previewFile, setPreviewFile] = useState(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [viewerEngine, setViewerEngine] = useState('microsoft');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortByFolder, setSortByFolder] = useState({});
  const sortBy = sortByFolder[currentFolder.id] || 'newest';

  // --- STATE TÍNH NĂNG WINDOWS ---
  const [contextMenu, setContextMenu] = useState(null);
  const [clipboard, setClipboard] = useState(null); 
  const [renamingItem, setRenamingItem] = useState(null);
  const [renameText, setRenameText] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set()); 
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loadError, setLoadError] = useState('');

  // 1. TẢI DỮ LIỆU TỪ FIREBASE
  useEffect(() => {
    const q = query(collection(db, 'windhub_files'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllFiles(filesData);
      setLoadError('');
    }, () => setLoadError('Không thể tải tài nguyên. Vui lòng thử lại sau.'));
    return () => unsubscribe();
  }, []);

  // [TỐI ƯU HÓA] Sử dụng useMemo thay vì useState + useEffect để tính toán currentFiles
  const currentFiles = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
    const filtered = allFiles.filter((f) => (
      (f.parentId || 'root') === currentFolder.id
      && (!normalizedSearchTerm || f.name?.toLocaleLowerCase().includes(normalizedSearchTerm))
    ));
    return filtered.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      if (sortBy === 'oldest') return (a.timestamp || 0) - (b.timestamp || 0);
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '', 'vi');
      if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '', 'vi');
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  }, [allFiles, currentFolder.id, searchTerm, sortBy]);

  const getDescendantIds = (rootIds) => {
    const ids = new Set(rootIds);
    let foundNewItem = true;

    while (foundNewItem) {
      foundNewItem = false;
      allFiles.forEach((item) => {
        if (ids.has(item.parentId) && !ids.has(item.id)) {
          ids.add(item.id);
          foundNewItem = true;
        }
      });
    }

    return ids;
  };

  const handleSortChange = (nextSort) => {
    setSortByFolder((current) => ({ ...current, [currentFolder.id]: nextSort }));
  };

  const wouldCreateFolderLoop = (targetFolderId, items) => items.some(
    (item) => item.type === 'folder' && getDescendantIds([item.id]).has(targetFolderId)
  );

  // Đóng Context Menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // 2. LOGIC CÁC PHÍM TẮT (KEYBOARD SHORTCUTS)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Bỏ qua nếu đang gõ chữ vào input/textarea hoặc đang mở bảng thông báo
      if (
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' ||
        renamingItem || showFolderModal || showDeleteModal || previewFile
      ) return;
      if (!isAdmin) return;

      if (e.key === 'Delete') {
        if (selectedItems.size > 0) setShowDeleteModal(true);
      } 
      else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); // Chặn bôi đen văn bản của trình duyệt
        setSelectedItems(new Set(currentFiles.map(f => f.id)));
      } 
      else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        if (selectedItems.size > 0) handleCopy();
      } 
      else if (e.key === 'x' && (e.ctrlKey || e.metaKey)) {
        if (selectedItems.size > 0) handleCut();
      } 
      else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        if (clipboard && clipboard.items.length > 0) handlePaste();
      } 
      else if (e.key === 'F2') {
        e.preventDefault();
        if (selectedItems.size === 1) {
          const item = currentFiles.find(f => f.id === Array.from(selectedItems)[0]);
          if (item) startRename(item);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItems, currentFiles, clipboard, renamingItem, showFolderModal, showDeleteModal, previewFile, isAdmin]);

  // 3. CÁC HÀM XỬ LÝ DỮ LIỆU
  const detectFileType = (url) => {
    try {
      const ext = url.split('.').pop().toLowerCase().split('?')[0];
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
      if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video';
      if (['mp3', 'wav', 'flac'].includes(ext)) return 'audio';
      if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv'].includes(ext)) return 'document';
      return 'raw';
    } catch { return 'raw'; }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!isAdmin) return toast.error('Chỉ admin mới có quyền quản lý file');
    if (!linkInput.trim()) return;
    let normalizedUrl;
    try {
      const parsedUrl = new URL(linkInput.trim());
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Unsupported protocol');
      normalizedUrl = parsedUrl.href;
    } catch {
      toast.error('Liên kết phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    setIsAdding(true);
    let name = linkInput.split('/').pop().split('?')[0] || ('Tài_nguyên_' + Math.floor(Math.random() * 1000));
    try {
      await addDoc(collection(db, 'windhub_files'), {
        name: decodeURIComponent(name), url: normalizedUrl, type: detectFileType(normalizedUrl), parentId: currentFolder.id,
        createdAt: new Date().toLocaleDateString('vi-VN'), timestamp: Date.now()
      });
      setLinkInput('');
      setShowLinkModal(false);
      toast.success('Đã thêm tài nguyên');
    } catch (error) { console.error("Lỗi:", error); } finally { setIsAdding(false); }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!isAdmin) return toast.error('Chỉ admin mới có quyền quản lý file');
    if (!folderName.trim()) return;
    try {
      await addDoc(collection(db, 'windhub_files'), {
        name: folderName, type: 'folder', parentId: currentFolder.id,
        createdAt: new Date().toLocaleDateString('vi-VN'), timestamp: Date.now()
      });
      setFolderName(''); setShowFolderModal(false);
      toast.success('Đã tạo thư mục');
    } catch (error) { console.error("Lỗi:", error); }
  };

  // 4. CHUỘT PHẢI & CHỌN FILE
  const handleItemClick = (e, item) => {
    if (renamingItem === item.id) return;
    if (e.ctrlKey || e.metaKey) {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(item.id)) newSelected.delete(item.id);
      else newSelected.add(item.id);
      setSelectedItems(newSelected);
    } else {
      if (item.type === 'folder') handleOpenFolder(item);
      else handlePreview(item);
      setSelectedItems(new Set());
    }
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    let x = e.clientX; let y = e.clientY;
    if (window.innerWidth - x < 200) x -= 180;
    if (window.innerHeight - y < 480) y = Math.max(8, window.innerHeight - 480);
    
    if (!selectedItems.has(item.id)) setSelectedItems(new Set([item.id]));
    setContextMenu({ x, y, item });
  };

  const handleBackgroundContextMenu = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    let x = e.clientX;
    let y = e.clientY;
    if (window.innerWidth - x < 220) x = window.innerWidth - 220;
    if (window.innerHeight - y < 260) y = Math.max(8, window.innerHeight - 260);
    setSelectedItems(new Set());
    setContextMenu({ x, y, item: null });
  };

  // 5. KÉO THẢ (DRAG & DROP)
  const handleDragStart = (e, item) => {
    if (!selectedItems.has(item.id)) setSelectedItems(new Set([item.id]));
    e.dataTransfer.setData('text/plain', item.id);
  };
  
  const handleDragOver = (e) => e.preventDefault();
  
  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (targetFolder.type !== 'folder') return;
    const draggedItemId = e.dataTransfer.getData('text/plain');
    const idsToMove = selectedItems.has(draggedItemId) ? selectedItems : new Set([draggedItemId]);
    const itemsToMove = allFiles.filter((file) => idsToMove.has(file.id));
    if (wouldCreateFolderLoop(targetFolder.id, itemsToMove)) {
      toast.error('Không thể di chuyển thư mục vào chính nó hoặc thư mục con');
      return;
    }
    try {
      await Promise.all(Array.from(idsToMove).map(id => {
        if (id === targetFolder.id) return Promise.resolve(); 
        return updateDoc(doc(db, 'windhub_files', id), { parentId: targetFolder.id });
      }));
      setSelectedItems(new Set());
      toast.success('Đã di chuyển tài nguyên');
    } catch (error) { console.error("Lỗi kéo thả:", error); }
  };

  // 6. COPY, CUT, PASTE, RENAME, DELETE
  function handleCopy() {
    if (!isAdmin) return;
    setClipboard({ action: 'copy', items: allFiles.filter(f => selectedItems.has(f.id)) });
    toast.success('Đã sao chép mục đã chọn');
  }
  function handleCut() {
    if (!isAdmin) return;
    setClipboard({ action: 'cut', items: allFiles.filter(f => selectedItems.has(f.id)) });
    toast.success('Đã cắt mục đã chọn');
  }

  async function handlePaste() {
    if (!isAdmin) return;
    if (!clipboard || !clipboard.items) return;
    if (clipboard.action === 'cut' && wouldCreateFolderLoop(currentFolder.id, clipboard.items)) {
      toast.error('Không thể di chuyển thư mục vào chính nó hoặc thư mục con');
      return;
    }
    try {
      await Promise.all(clipboard.items.map(async (item) => {
        if (clipboard.action === 'cut') {
          await updateDoc(doc(db, 'windhub_files', item.id), { parentId: currentFolder.id });
        } else {
          const dataToCopy = { ...item };
          delete dataToCopy.id;
          await addDoc(collection(db, 'windhub_files'), { ...dataToCopy, name: dataToCopy.name + ' - Copy', parentId: currentFolder.id, timestamp: Date.now() });
        }
      }));
      if (clipboard.action === 'cut') setClipboard(null); 
      toast.success('Đã dán tài nguyên');
    } catch (error) { console.error("Lỗi Paste:", error); }
  }

  function startRename(item) { setRenamingItem(item.id); setRenameText(item.name); }
  
  const handleRenameSubmit = async (e, id) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!renameText.trim()) { setRenamingItem(null); return; }
    try { await updateDoc(doc(db, 'windhub_files', id), { name: renameText }); } 
    catch (error) { console.error("Lỗi Rename:", error); }
    setRenamingItem(null);
  };

  const confirmDelete = async () => {
    if (!isAdmin) return;
    try {
      const idsToDelete = getDescendantIds(Array.from(selectedItems));
      await Promise.all(Array.from(idsToDelete).map(id => deleteDoc(doc(db, 'windhub_files', id))));
      setSelectedItems(new Set());
      toast.success('Đã xóa tài nguyên');
    } catch (error) { console.error("Lỗi xóa:", error); } 
    finally { setShowDeleteModal(false); }
  };

  const handleDownload = (item) => {
    // Nếu file bị khóa, cấm tất cả mọi người tải về (kể cả Admin)
    if (item.isLocked) return toast.error('Tệp tin này đã bị khóa, không thể tải xuống!');
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const handlePreview = (item) => {
    if (item.isLocked && !isAdmin) return toast.error('File này đã bị khóa');
    setViewerEngine('microsoft');
    setPreviewFile(item);
  };
  const handleCopyLink = async (item) => {
    if (!isAdmin) return;
    try {
      await navigator.clipboard.writeText(item.url);
      toast.success('Đã sao chép liên kết');
    } catch {
      toast.error('Không thể sao chép liên kết');
    }
  };
  const startEditLink = async (item) => {
    if (!isAdmin) return;
    const nextUrl = window.prompt('Nhap lien ket moi', item.url);
    if (nextUrl === null || nextUrl.trim() === item.url) return;
    try {
      const parsedUrl = new URL(nextUrl.trim());
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Unsupported protocol');
      await updateDoc(doc(db, 'windhub_files', item.id), { url: parsedUrl.href, type: detectFileType(parsedUrl.href) });
      toast.success('Đã cập nhật liên kết');
    } catch {
      toast.error('Liên kết không hợp lệ');
    }
  };
  const handleToggleLock = async (item) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'windhub_files', item.id), { isLocked: !item.isLocked });
      toast.success(item.isLocked ? 'Đã mở khóa file' : 'Đã khóa file');
    } catch {
      toast.error('Không thể cập nhật trạng thái file');
    }
  };

  // 7. ĐIỀU HƯỚNG & UI
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
    if (type === 'folder') return <FolderIcon size={40} className="text-amber-500 fill-amber-500/20" />;
    if (type === 'image') return <ImageIcon size={32} className="text-amber-500" />;
    if (type === 'video') return <Video size={32} className="text-purple-500" />;
    if (type === 'audio') return <Music size={32} className="text-pink-500" />;
    if (type === 'document') return <FileText size={32} className="text-orange-500" />;
    return <Globe size={32} className="text-slate-500" />;
  };

  const itemToDelete = selectedItems.size > 1 
    ? { name: `${selectedItems.size} mục đã chọn` } 
    : allFiles.find(f => f.id === Array.from(selectedItems)[0]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col gap-4 relative">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 gap-4 z-10">
        <div className="shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quản lý Tài nguyên</h2>
        </div>
        
        <div className="hidden">
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
            <FolderPlus size={18} /> Tạo Thư mục
          </button>
          
          <form onSubmit={handleAddLink} className="flex flex-1 sm:w-80 relative shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LinkIcon size={16} className="text-slate-400" /></div>
            <input type="url" value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="Dán link vào đây..." className="pl-10 pr-4 py-2 w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required disabled={isAdding} />
            <button type="submit" disabled={isAdding} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-xl font-medium transition-colors text-sm">Lưu</button>
          </form>
        </div>
      </div>

      <Breadcrumb path={path} handleNavigateTo={handleNavigateTo} />
      
      {/* KHU VỰC TÌM KIẾM VÀ SẮP XẾP */}
      <div className="flex flex-col gap-3 sm:flex-row w-full z-10">
        
        {/* Ô Tìm Kiếm */}
        <div className="relative flex-1">
          <span className="sr-only">Tìm kiếm trong thư mục hiện tại</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm trong thư mục hiện tại..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-800 dark:bg-[#111] dark:text-slate-100 placeholder:text-slate-600"
          />
        </div>

        {/* Nút Chọn Kiểu Sắp Xếp */}
        <div className="relative w-full sm:w-44 shrink-0 group">
          <select 
            value={sortBy} 
            onChange={(e) => handleSortChange(e.target.value)} 
            aria-label="Sắp xếp file" 
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-800 dark:bg-[#111] dark:text-slate-100 cursor-pointer"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="name-asc">Tên A–Z</option>
            <option value="name-desc">Tên Z–A</option>
          </select>
          
          {/* Icon Mũi tên Custom cho đẹp thay vì mũi tên mặc định của trình duyệt */}
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500 group-hover:text-primary-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>
        
      </div>

      {/* Lưới hiển thị */}
      <div 
        className="flex-1 bg-white dark:bg-zinc-950 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6 overflow-y-auto custom-scrollbar"
        onClick={() => setSelectedItems(new Set())}
        onContextMenu={handleBackgroundContextMenu}
      >
        {loadError ? (
          <div className="flex h-full items-center justify-center text-center text-red-600 dark:text-red-400">{loadError}</div>
        ) : currentFiles.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-slate-400">
            <FolderIcon size={64} className="mb-4 opacity-30" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Thư mục trống</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            <AnimatePresence>
              {currentFiles.map((file) => (
                <motion.div 
                  key={file.id} 
                  layout /* Gọi lại layout để giữ tính năng dồn chỗ */
  
                  /* Vẫn giữ nguyên hiệu ứng Lật 3D của bạn */
                  initial={{ opacity: 0, rotateX: 90, y: 20 }} 
                  animate={{ opacity: 1, rotateX: 0, y: 0 }} 
                  exit={{ opacity: 0, rotateX: -90, y: -20 }} 
  
                  /* BÍ QUYẾT TỐI ƯU Ở ĐÂY: Tách biệt tốc độ */
                  transition={{ 
                  // 1. Ép hiệu ứng dồn chỗ (layout) chạy đồng loạt cực nhanh (0.15s)
                  layout: { type: "tween", duration: 0.1, ease: "easeInOut" },
    
                  // 2. Hiệu ứng lật 3D thì vẫn giữ tốc độ mượt mà cũ (0.4s)
                  default: { duration: 0.4, type: "tween", ease: "backOut" } 
                  }}
  
                  draggable={true} 
                  onDragStart={(e) => handleDragStart(e, file)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, file)}
  
                  onClick={(e) => { e.stopPropagation(); handleItemClick(e, file); }}
                  onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, file); }}
  
                  className={`group relative bg-slate-50 dark:bg-slate-800/50 border-2 ${selectedItems.has(file.id) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md' : 'border-transparent hover:border-primary-300 dark:hover:border-primary-700'} rounded-xl p-4 flex flex-col items-center gap-3 transition-colors select-none`}
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 dark:bg-slate-900/90 p-1 rounded-lg shadow-sm z-10">
                    <button aria-label={`Mở tác vụ cho ${file.name}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleContextMenu(e, file); }} className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  {file.isLocked && <div className="absolute top-2 left-2 rounded-lg bg-slate-900/80 p-1.5 text-white shadow-sm"><LockKeyhole size={14} /></div>}
                  
                  <div className={`w-full aspect-square flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden ${file.type === 'folder' ? 'cursor-pointer' : 'cursor-default'}`}>
                    {file.type === 'image' ? <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" decoding="async" /> : getFileIcon(file.type)}
                  </div>
                  
                  <div className="w-full text-center">
                    {renamingItem === file.id ? (
                      <form onSubmit={(e) => handleRenameSubmit(e, file.id)}>
                         <input autoFocus type="text" value={renameText} title={renameText} onFocus={(e) => e.currentTarget.select()} onChange={e => setRenameText(e.target.value)} onBlur={(e) => handleRenameSubmit(e, file.id)} className="w-full min-w-0 text-sm font-medium text-center bg-white dark:bg-slate-900 border border-blue-500 rounded px-2 py-1 focus:outline-none" />
                      </form>
                    ) : (
                      <div className="overflow-hidden whitespace-nowrap px-1 text-sm font-medium leading-5 text-slate-700 dark:text-slate-200" title={file.name}><span className="file-name-marquee">{file.name}</span></div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ContextMenu 
        contextMenu={contextMenu} setContextMenu={setContextMenu}
        setPreviewFile={setPreviewFile} startRename={startRename}
        handleCopy={handleCopy} handleCut={handleCut}
        setShowDeleteModal={setShowDeleteModal} 
        selectedItems={selectedItems} 
        handlePreview={handlePreview}
        handleDownload={handleDownload} 
        handleCopyLink={handleCopyLink}
        isAdmin={isAdmin}
        startEditLink={startEditLink}
        handleToggleLock={handleToggleLock}
        onCreateFolder={() => setShowFolderModal(true)}
        onAddLink={() => setShowLinkModal(true)}
        handlePaste={handlePaste}
        hasClipboard={Boolean(clipboard)}
        sortBy={sortBy}
        onSortChange={handleSortChange}
      />

      <FileModals 
        showFolderModal={showFolderModal} setShowFolderModal={setShowFolderModal}
        showLinkModal={showLinkModal} setShowLinkModal={setShowLinkModal}
        linkInput={linkInput} setLinkInput={setLinkInput} handleAddLink={handleAddLink}
        folderName={folderName} setFolderName={setFolderName} handleCreateFolder={handleCreateFolder}
        fileToDelete={showDeleteModal ? itemToDelete : null} setFileToDelete={() => setShowDeleteModal(false)} confirmDelete={confirmDelete}
        previewFile={previewFile} setPreviewFile={setPreviewFile} 
        viewerEngine={viewerEngine} setViewerEngine={setViewerEngine}
      />
    </motion.div>
  );
}
