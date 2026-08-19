// src/modules/FileManager/index.jsx
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Image as ImageIcon, Video, Globe, Music,
    Folder as FolderIcon, FileText
} from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import ContextMenu from './components/ContextMenu';
import Breadcrumb from './components/Breadcrumb';
import FileModals from './components/FileModals/index.jsx';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { uploadUrlToCloudinary } from '@/services/thumbnail';

// Import các Module UI đã được tách ra
import FileManagerHeader from './components/FileManagerHeader';
import FileManagerToolbar from './components/FileManagerToolbar';
import FileGrid from './components/FileGrid';

export default function FileManager() {
  const { isAdmin } = useAuthStore();
  const [allFiles, setAllFiles] = useState([]);
  
  // 1. Khai báo danh sách không gian (Tabs) độc lập hoàn toàn
  const TABS = [
    { id: 'video', label: 'Video', rootId: 'root_video' },
    { id: 'image', label: 'Hình ảnh', rootId: 'root_image' },
    { id: 'document', label: 'Tài liệu', rootId: 'root_document' },
    { id: 'other', label: 'File khác', rootId: 'root_other' },
  ];

  // 2. Cập nhật state mặc định khởi tạo từ Tab đầu tiên
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [currentFolder, setCurrentFolder] = useState({ id: TABS[0].rootId, name: TABS[0].label });
  const [path, setPath] = useState([{ id: TABS[0].rootId, name: TABS[0].label }]);
  
  const [previewFile, setPreviewFile] = useState(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [viewerEngine, setViewerEngine] = useState('microsoft');
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSort, setGlobalSort] = useState({}); // Mặc định từ Firebase
  const [localSort, setLocalSort] = useState({});
  // Ghi đè trong phiên
  const effectiveSort = localSort[currentFolder.id] || globalSort[currentFolder.id] || 'newest';
  const [viewMode, setViewMode] = useState('grid'); // Dạng hiển thị: 'grid' hoặc 'list'

  // --- STATE TÍNH NĂNG WINDOWS ---
  const [contextMenu, setContextMenu] = useState(null);
  const [clipboard, setClipboard] = useState(null); 
  const [renamingItem, setRenamingItem] = useState(null);
  const [renameText, setRenameText] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set()); 
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Hàm xử lý chuyển không gian làm việc
  const handleTabChange = (tab) => {
    setActiveTab(tab.id);
    setCurrentFolder({ id: tab.rootId, name: tab.label });
    setPath([{ id: tab.rootId, name: tab.label }]);
    setSelectedItems(new Set()); // Xóa các file đang chọn nếu có
    setSearchTerm(''); // Xóa nội dung tìm kiếm khi đổi tab
  };

  useEffect(() => {
    const unsubSort = onSnapshot(doc(db, 'windhub_settings', 'sort_config'), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalSort(docSnap.data()); // Chỉ đồng bộ state gốc
      }
    });
    return () => unsubSort();
  }, []);

  // 1. TẢI FIREBASE
  useEffect(() => {
    const q = query(collection(db, 'windhub_files'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllFiles(filesData);
      setLoadError('');
    }, () => setLoadError('Không thể tải tài nguyên. Vui lòng thử lại sau.'));
    return () => unsubscribe();
  }, []);

  // Hỗ trợ ép link Dropbox và Google Drive thành link tải trực tiếp
  const formatDownloadLink = (url, currentTab) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname.includes('dropbox.com')) {
        parsedUrl.searchParams.set('dl', '1');
        return parsedUrl.href;
      }
      // Bắt cả drive và docs.google.com
      if (parsedUrl.hostname.includes('drive.google.com') || parsedUrl.hostname.includes('docs.google.com')) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          if (currentTab === 'other') {
            return `https://drive.google.com/uc?export=download&id=${match[1]}`;
          }
          return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
      }
      return url;
    } catch { return url; }
  };

  // [TỐI ƯU] Sử dụng useMemo thay vì useState + useEffect để tính toán currentFiles
  const currentFiles = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
    const filtered = allFiles.filter((f) => {
      const matchFolder = (f.parentId || 'root') === currentFolder.id;
      const matchSearch = !normalizedSearchTerm || f.name?.toLocaleLowerCase().includes(normalizedSearchTerm);
      
      return matchFolder && matchSearch;
    });

    return filtered.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      if (effectiveSort === 'oldest') return (a.timestamp || 0) - (b.timestamp || 0);
      if (effectiveSort === 'name-asc') return (a.name || '').localeCompare(b.name || '', 'vi', { numeric: true });
if (effectiveSort === 'name-desc') return (b.name || '').localeCompare(a.name || '', 'vi', { numeric: true });
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  }, [allFiles, currentFolder.id, searchTerm, effectiveSort]);

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

  // Dành cho thanh tìm kiếm (Từ User): Lọc tạm thời trong phiên
  const handleLocalSortChange = (nextSort) => {
    setLocalSort((current) => ({ ...current, [currentFolder.id]: nextSort }));
  };

  // Dành cho Context Menu (Chỉ Admin): Cập nhật lên Firebase
  const handleGlobalSortChange = async (nextSort) => {
    if (!isAdmin) return;
    
    // Xóa ghi đè local (nếu admin thấy ngay thay đổi)
    setLocalSort((current) => {
      const newLocal = { ...current };
      delete newLocal[currentFolder.id];
      return newLocal;
    });

    try {
      await setDoc(doc(db, 'windhub_settings', 'sort_config'), {
        [currentFolder.id]: nextSort
      }, { merge: true });
      toast.success('Đã cập nhật đồng bộ');
    } catch (error) {
      console.error("Lỗi khi đồng bộ sắp xếp:", error);
    }
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
      // Bỏ qua nếu đang gõ vào input/textarea hoặc đang mở bảng thông báo
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
        e.preventDefault(); // Chống bôi đen văn bản của trình duyệt
        setSelectedItems(new Set(currentFiles.map(f => f.id)));
      } 
      else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        if (selectedItems.size > 0) { e.preventDefault(); handleCopy(); }
      } 
      else if (e.key === 'x' && (e.ctrlKey || e.metaKey)) {
        if (selectedItems.size > 0) { e.preventDefault(); handleCut(); }
      } 
      else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        if (clipboard && clipboard.items.length > 0) { e.preventDefault(); handlePaste(); }
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

  // 3. CÁC HÀM TẠO
  const detectFileType = (url, currentTab) => {
    try {
      const ext = url.split('.').pop().toLowerCase().split('?')[0];
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
      if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video';
      if (['mp3', 'wav', 'flac'].includes(ext)) return 'audio';
      if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv'].includes(ext)) return 'document';
      
      // Nếu không có đuôi file (VD: Google Drive Preview) -> Ưu tiên gán type theo Tab hiện tại
      if (currentTab && currentTab !== 'all' && currentTab !== 'other') return currentTab;
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
      normalizedUrl = formatDownloadLink(parsedUrl.href, activeTab);
    } catch {
      toast.error('Liên kết phải đúng định dạng http:// hoặc https://');
      return;
    }
    setIsAdding(true);

    let extractedName = linkInput.split('/').pop().split('?')[0];
    let driveId = null;

    if (linkInput.includes('drive.google.com') || linkInput.includes('docs.google.com')) {
      const match = linkInput.match(/\/d\/([a-zA-Z0-9_-]+)/) || linkInput.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
         driveId = match[1];
         extractedName = `Google_Drive_${driveId}`;
      }
    } else {
      extractedName = decodeURIComponent(extractedName || ('File_' + Math.floor(Math.random() * 10000)));
    }

    try {
      const docRef = await addDoc(collection(db, 'windhub_files'), {
        name: extractedName, 
        url: normalizedUrl, 
        type: detectFileType(normalizedUrl, activeTab), 
        parentId: currentFolder.id,
        createdAt: new Date().toLocaleDateString('vi-VN'), 
        timestamp: Date.now()
      });

      // TỰ ĐỘNG BÓC THUMBNAIL TỪ DRIVE VÀ ĐẨY LÊN CLOUDINARY
      if (driveId && ['video', 'image', 'document'].includes(activeTab)) {
         const driveThumbUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
         uploadUrlToCloudinary(docRef.id, driveThumbUrl); // Chạy ngầm, không await để không block UI
      }

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
    // Bỏ 2 dòng tính toán trừ tọa độ x, y cứng nhắc đi, chỉ truyền tọa độ gốc
    if (!selectedItems.has(item.id)) setSelectedItems(new Set([item.id]));
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleBackgroundContextMenu = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    // Giao phó toàn bộ việc tính toán tọa độ cho component ContextMenu
    setSelectedItems(new Set());
    setContextMenu({ x: e.clientX, y: e.clientY, item: null });
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
    toast.success('Đã sao chép bản tạm');
  }

  function handleCut() {
    if (!isAdmin) return;
    setClipboard({ action: 'cut', items: allFiles.filter(f => selectedItems.has(f.id)) });
    toast.success('Đã cắt');
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
    
    const targetItem = allFiles.find(f => f.id === id);
    const newName = renameText.trim();
    
    // NẾU TÊN TRỐNG HOẶC KHÔNG THAY ĐỔI THÌ BỎ QUA LUÔN (ĐỠ TỐN REQUEST FIREBASE)
    if (!newName || newName === targetItem?.name) { 
      setRenamingItem(null); 
      return; 
    }

    try { await updateDoc(doc(db, 'windhub_files', id), { name: newName }); } 
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
    // Nếu file bị khóa, cấm tải (kể cả Admin)
    if (item.isLocked) return toast.error('Tập tin này đang khóa, không thể tải xuống!');
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const handlePreview = (item) => {
    //if (item.isLocked && !isAdmin) return toast.error('File này đang khóa');
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
    const nextUrl = window.prompt('Nhập liên kết mới', item.url);
    if (nextUrl === null || nextUrl.trim() === item.url) return;
    try {
      const parsedUrl = new URL(nextUrl.trim());
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Unsupported protocol');
      
      const finalUrl = formatDownloadLink(parsedUrl.href, activeTab); 
      
      await updateDoc(doc(db, 'windhub_files', item.id), { 
        url: finalUrl, 
        type: detectFileType(finalUrl, activeTab) 
      });

      // BÓC THUMBNAIL NẾU LÀ LINK DRIVE VÀ CHƯA CÓ THUMBNAIL TỪ TRƯỚC
      if ((finalUrl.includes('drive.google.com') || finalUrl.includes('docs.google.com')) && ['video', 'image', 'document'].includes(activeTab) && !item.thumbnailUrl) {
         const match = finalUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || finalUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
         if (match && match[1]) {
             const driveThumbUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
             uploadUrlToCloudinary(item.id, driveThumbUrl);
         }
      }

      toast.success('Đã cập nhật liên kết');
    } catch { toast.error('Liên kết không hợp lệ'); }
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
      
      <FileManagerHeader clipboard={clipboard} handlePaste={handlePaste} />

      <Breadcrumb path={path} handleNavigateTo={handleNavigateTo} />

      <FileManagerToolbar 
        TABS={TABS} activeTab={activeTab} handleTabChange={handleTabChange}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        effectiveSort={effectiveSort} handleLocalSortChange={handleLocalSortChange}
        viewMode={viewMode} setViewMode={setViewMode}
      />

      <FileGrid 
        loadError={loadError} currentFiles={currentFiles} viewMode={viewMode} 
        selectedItems={selectedItems} setSelectedItems={setSelectedItems}
        renamingItem={renamingItem} renameText={renameText} setRenameText={setRenameText} handleRenameSubmit={handleRenameSubmit}
        handleDragStart={handleDragStart} handleDragOver={handleDragOver} handleDrop={handleDrop}
        handleItemClick={handleItemClick} handleContextMenu={handleContextMenu} getFileIcon={getFileIcon}
        handleBackgroundContextMenu={handleBackgroundContextMenu}
      />

      <ContextMenu 
        contextMenu={contextMenu} setContextMenu={setContextMenu} setPreviewFile={setPreviewFile} startRename={startRename}
        handleCopy={handleCopy} handleCut={handleCut} setShowDeleteModal={setShowDeleteModal} selectedItems={selectedItems}
        handlePreview={handlePreview} handleDownload={handleDownload} handleCopyLink={handleCopyLink} isAdmin={isAdmin}
        startEditLink={startEditLink} handleToggleLock={handleToggleLock} onCreateFolder={() => setShowFolderModal(true)}
        onAddLink={() => setShowLinkModal(true)} handlePaste={handlePaste} hasClipboard={Boolean(clipboard)}
        sortBy={globalSort[currentFolder.id] || 'newest'} onSortChange={handleGlobalSortChange}
      />

      <FileModals 
        showFolderModal={showFolderModal} setShowFolderModal={setShowFolderModal}
        showLinkModal={showLinkModal} setShowLinkModal={setShowLinkModal}
        linkInput={linkInput} setLinkInput={setLinkInput} handleAddLink={handleAddLink}
        folderName={folderName} setFolderName={setFolderName} handleCreateFolder={handleCreateFolder}
        fileToDelete={showDeleteModal ? itemToDelete : null} setFileToDelete={() => setShowDeleteModal(false)} confirmDelete={confirmDelete}
        previewFile={previewFile} setPreviewFile={setPreviewFile} viewerEngine={viewerEngine} setViewerEngine={setViewerEngine}
      />
    </motion.div>
  );
}
