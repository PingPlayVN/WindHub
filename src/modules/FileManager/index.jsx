// src/modules/FileManager/index.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import ContextMenu from './components/ContextMenu';
import Breadcrumb from './components/Breadcrumb';
import FileModals from './components/FileModals/index.jsx';
import BottomActionBar from './components/BottomActionBar';
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
import { useFileSharing, useSharedItemLink } from './features/FileSharing';
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

  // --- STATE TÍNH NĂNG WINDOWS & MOBILE SELECTION ---
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set()); 
  const {
    allFiles, currentFiles, effectiveSort, globalSort, loadError, isLoading,
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
  const {
    shareItem, shareUrl, handleShare, closeShareDialog, copyShareUrl, shareNatively,
  } = useFileSharing();
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
    showMoveModal, setShowMoveModal, itemsToMove, startMove, handleMoveSubmit,
  } = organization;

  const {
    isSelectionMode,
    handleItemClick, handleItemDoubleClick, handleLongPress,
    toggleItemSelection, toggleSelectAll, clearSelection, toggleSelectionMode,
    handleDragStart,
  } = useFileSelection({
    handleOpenFolder, handlePreview, renamingItem, selectedItems, setSelectedItems,
  });

  useSharedItemLink({
    allFiles, isLoading, loadError, searchParams, setSearchParams,
    handlePreview, handleOpenSharedFolder,
  });

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
    clearSelection();
    setSearchTerm('');
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

  // CHUỘT PHẢI & CHỌN FILE
  const handleContextMenu = (e, item) => {
    e.preventDefault();
    if (!selectedItems.has(item.id)) setSelectedItems(new Set([item.id]));
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleBackgroundContextMenu = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSelectedItems(new Set());
    setContextMenu({ x: e.clientX, y: e.clientY, item: null });
  };

  // KÉO THẢ (DRAG & DROP)
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
        isSelectionMode={isSelectionMode} toggleSelectionMode={toggleSelectionMode}
      />

      <FileGrid 
        loadError={loadError} currentFiles={currentFiles} viewMode={viewMode} isLoading={isLoading}
        currentFolderId={currentFolder.id}
        selectedItems={selectedItems} setSelectedItems={setSelectedItems}
        isSelectionMode={isSelectionMode} handleLongPress={handleLongPress} toggleItemSelection={toggleItemSelection}
        onClearSelection={clearSelection}
        renamingItem={renamingItem} renameText={renameText} setRenameText={setRenameText} handleRenameSubmit={handleRenameSubmit}
        handleDragStart={handleDragStart} handleDragOver={handleDragOver} handleDrop={handleDrop}
        handleItemClick={handleItemClick} handleItemDoubleClick={handleItemDoubleClick} handleContextMenu={handleContextMenu} getFileIcon={getFileIcon}
        handleBackgroundContextMenu={handleBackgroundContextMenu}
        onRetry={() => window.location.reload()}
      />

      <ContextMenu 
        contextMenu={contextMenu} setContextMenu={setContextMenu} setPreviewFile={setPreviewFile} startRename={startRename}
        handleCopy={handleCopy} handleCut={handleCut} setShowDeleteModal={setShowDeleteModal} selectedItems={selectedItems}
        handlePreview={handlePreview} handleDownload={handleDownload} handleCopyLink={handleCopyLink} isAdmin={isAdmin}
        startEditLink={startEditLink} handleToggleLock={handleToggleLock} onCreateFolder={() => setShowFolderModal(true)}
        onAddLink={() => setShowLinkModal(true)} handlePaste={handlePaste} hasClipboard={Boolean(clipboard?.itemIds?.length)}
        sortBy={globalSort[currentFolder.id] || 'newest'} onSortChange={handleGlobalSortChange}
        handleShare={handleShare} startMove={startMove}
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
        shareItem={shareItem} shareUrl={shareUrl} closeShareDialog={closeShareDialog}
        copyShareUrl={copyShareUrl} shareNatively={shareNatively}
        showMoveModal={showMoveModal} setShowMoveModal={setShowMoveModal}
        itemsToMove={itemsToMove} handleMoveSubmit={handleMoveSubmit}
        allFiles={allFiles} activeTabRootId={currentFolder.id}
      />

      <BottomActionBar 
        isSelectionMode={isSelectionMode}
        selectedItems={selectedItems}
        allFiles={allFiles}
        isAdmin={isAdmin}
        onClearSelection={clearSelection}
        onSelectAllToggle={() => toggleSelectAll(currentFiles)}
        isAllSelected={currentFiles.length > 0 && currentFiles.every(f => selectedItems.has(f.id))}
        onDownload={handleDownload}
        onShare={handleShare}
        onMove={() => startMove()}
        onDelete={() => setShowDeleteModal(true)}
        onToggleLock={handleToggleLock}
      />
    </motion.div>
  );
}
