// src/modules/FileManager/index.jsx
import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import ContextMenu from './components/ContextMenu';
import Breadcrumb from './components/Breadcrumb';
import FileModals from './components/FileModals/index.jsx';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

// Import các Module UI đã được tách ra
import FileManagerHeader from './components/FileManagerHeader';
import FileManagerToolbar from './components/FileManagerToolbar';
import FileGrid from './components/FileGrid';
import { useFileData } from './hooks/useFileData';
import { useFileNavigation } from './hooks/useFileNavigation';
import { useFileCreation } from './hooks/useFileCreation';
import { useFileClipboard } from './hooks/useFileClipboard';
import { useFilePreview } from './hooks/useFilePreview';
import { useFileOrganization } from './hooks/useFileOrganization';
import { useFileSelection } from './hooks/useFileSelection';
import { useFileKeyboardShortcuts } from './hooks/useFileKeyboardShortcuts';
import { useFileSharing } from './hooks/useFileSharing';
import { getFileIcon } from './utils/fileIcons';

export default function FileManager() {
  const { isAdmin } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    TABS, activeTab, currentFolder, path, handleTabChange, handleOpenFolder,
    handleOpenSharedFolder, handleNavigateTo,
  } = useFileNavigation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // Dạng hiển thị: 'grid' hoặc 'list'

  // --- STATE TÍNH NĂNG WINDOWS ---
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set()); 
  const processedShareRef = useRef('');

  const {
    allFiles, currentFiles, effectiveSort, globalSort, loadError,
    handleLocalSortChange, handleGlobalSortChange: updateGlobalSort,
  } = useFileData(currentFolder.id, searchTerm);

  const creation = useFileCreation({ isAdmin, activeTab, currentFolderId: currentFolder.id });
  const { clipboard, handleCopy, handleCut, handlePaste } = useFileClipboard({
    isAdmin, allFiles, selectedItems, setSelectedItems, currentFolderId: currentFolder.id,
  });
  const preview = useFilePreview({ isAdmin });
  const organization = useFileOrganization({
    isAdmin, activeTab, allFiles, selectedItems, setSelectedItems,
  });
  const { handleShare } = useFileSharing();
  const {
    showFolderModal, setShowFolderModal, folderName, setFolderName,
    showLinkModal, setShowLinkModal, linkInput, setLinkInput,
    isCreating, handleAddLink, handleCreateFolder,
  } = creation;
  const { previewFile, setPreviewFile, viewerEngine, setViewerEngine, handlePreview, handleDownload, handleCopyLink } = preview;
  const {
    renamingItem, renameText, setRenameText, showDeleteModal, setShowDeleteModal,
    showEditLinkModal, setShowEditLinkModal, editLinkInput, setEditLinkInput, isUpdating,
    handleDrop, startRename, handleRenameSubmit, confirmDelete, startEditLink, handleSaveEditLink, handleToggleLock,
  } = organization;
  const { handleItemClick, handleItemHover, handleDragStart } = useFileSelection({
    handleOpenFolder, handlePreview, renamingItem, setSelectedItems,
  });

  // --- LOGIC XỬ LÝ URL CHIA SẺ ---
  useEffect(() => {
    // Đợi Firebase load xong danh sách file
    if (allFiles.length === 0) return;

    const fileId = searchParams.get('fileId');
    const folderId = searchParams.get('folderId');
    const shareKey = `${fileId || ''}:${folderId || ''}`;

    if (!fileId && !folderId) return;
    if (processedShareRef.current === shareKey) return;
    processedShareRef.current = shareKey;

    const nextSearchParams = new URLSearchParams(searchParams);

    if (fileId) {
      const targetFile = allFiles.find(f => f.id === fileId);
      if (targetFile && targetFile.type !== 'folder') {
        handlePreview(targetFile); // Tự động mở Preview Modal
      } else {
        toast.error('File không tồn tại hoặc đã bị xóa!');
      }
      // Dọn dẹp URL sau khi xử lý xong (giúp việc F5 không bị lặp lại)
      nextSearchParams.delete('fileId');
    }

    if (folderId) {
      const targetFolder = allFiles.find(f => f.id === folderId);
      if (targetFolder && targetFolder.type === 'folder') {
        if (!handleOpenSharedFolder(targetFolder, allFiles)) {
          toast.error('Không xác định được không gian của thư mục!');
        }
      } else {
        toast.error('Thư mục không tồn tại hoặc đã bị xóa!');
      }
      nextSearchParams.delete('folderId');
    }

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [allFiles, searchParams, setSearchParams, handlePreview, handleOpenSharedFolder]);

  const handleGlobalSortChange = async (nextSort) => {
    if (!isAdmin) return;
    try {
      await updateGlobalSort(nextSort, isAdmin);
      toast.success('Đã cập nhật đồng bộ');
    } catch (error) {
      console.error('Lỗi khi đồng bộ sắp xếp:', error);
      toast.error('Không thể cập nhật cách sắp xếp. Vui lòng thử lại.');
    }
  };

  const handleTabChangeAndReset = (tab) => {
    handleTabChange(tab);
    setSelectedItems(new Set()); // Xóa các file đang chọn nếu có
    setSearchTerm(''); // Xóa nội dung tìm kiếm khi đổi tab
  };

  // Đóng Context Menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useFileKeyboardShortcuts({
    isAdmin, currentFiles, selectedItems, setSelectedItems, clipboard,
    handleCopy, handleCut, handlePaste, startRename, renamingItem,
    showFolderModal, showDeleteModal, previewFile, setShowDeleteModal,
  });

  // 4. CHUỘT PHẢI & CHỌN FILE
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
  const handleDragOver = (e) => e.preventDefault();

  const itemToDelete = selectedItems.size > 1 
    ? { name: `${selectedItems.size} mục đã chọn` } 
    : allFiles.find(f => f.id === Array.from(selectedItems)[0]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="file-manager-shell min-h-0 h-full flex flex-col gap-4 relative">
      
      <FileManagerHeader />

      <Breadcrumb path={path} handleNavigateTo={handleNavigateTo} />

      <FileManagerToolbar 
        TABS={TABS} activeTab={activeTab} handleTabChange={handleTabChangeAndReset}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        effectiveSort={effectiveSort} handleLocalSortChange={handleLocalSortChange}
        viewMode={viewMode} setViewMode={setViewMode}
      />

      <FileGrid 
        loadError={loadError} currentFiles={currentFiles} viewMode={viewMode} 
        selectedItems={selectedItems} setSelectedItems={setSelectedItems}
        renamingItem={renamingItem} renameText={renameText} setRenameText={setRenameText} handleRenameSubmit={handleRenameSubmit}
        handleDragStart={handleDragStart} handleDragOver={handleDragOver} handleDrop={handleDrop}
        handleItemClick={handleItemClick} handleItemHover={handleItemHover} handleContextMenu={handleContextMenu} getFileIcon={getFileIcon}
        handleBackgroundContextMenu={handleBackgroundContextMenu}
      />

      <ContextMenu 
        contextMenu={contextMenu} setContextMenu={setContextMenu} setPreviewFile={setPreviewFile} startRename={startRename}
        handleCopy={handleCopy} handleCut={handleCut} setShowDeleteModal={setShowDeleteModal} selectedItems={selectedItems}
        handlePreview={handlePreview} handleDownload={handleDownload} handleCopyLink={handleCopyLink} isAdmin={isAdmin}
        startEditLink={startEditLink} handleToggleLock={handleToggleLock} onCreateFolder={() => setShowFolderModal(true)}
        onAddLink={() => setShowLinkModal(true)} handlePaste={handlePaste} hasClipboard={Boolean(clipboard?.itemIds?.length)}
        sortBy={globalSort[currentFolder.id] || 'newest'} onSortChange={handleGlobalSortChange}
        handleShare={handleShare}
      />

      <FileModals 
        showFolderModal={showFolderModal} setShowFolderModal={setShowFolderModal}
        showLinkModal={showLinkModal} setShowLinkModal={setShowLinkModal}
        isCreating={isCreating}
        linkInput={linkInput} setLinkInput={setLinkInput} handleAddLink={handleAddLink}
        showEditLinkModal={showEditLinkModal} setShowEditLinkModal={setShowEditLinkModal}
        editLinkInput={editLinkInput} setEditLinkInput={setEditLinkInput}
        handleSaveEditLink={handleSaveEditLink} isUpdating={isUpdating}
        folderName={folderName} setFolderName={setFolderName} handleCreateFolder={handleCreateFolder}
        fileToDelete={showDeleteModal ? itemToDelete : null} setFileToDelete={() => setShowDeleteModal(false)} confirmDelete={confirmDelete}
        previewFile={previewFile} setPreviewFile={setPreviewFile} viewerEngine={viewerEngine} setViewerEngine={setViewerEngine}
      />
    </motion.div>
  );
}
