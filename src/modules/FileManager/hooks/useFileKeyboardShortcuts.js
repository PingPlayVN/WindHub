import { useEffect } from 'react';

export function useFileKeyboardShortcuts({
  isAdmin, currentFiles, selectedItems, setSelectedItems, clipboard,
  handleCopy, handleCut, handlePaste, startRename,
  renamingItem, showFolderModal, showDeleteModal, previewFile, setShowDeleteModal,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        renamingItem || showFolderModal || showDeleteModal || previewFile
      ) return;

      if (!isAdmin) return;
      if (event.key === 'Delete') {
        if (selectedItems.size > 0) setShowDeleteModal(true);
      } else if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setSelectedItems(new Set(currentFiles.map((file) => file.id)));
      } else if (event.key === 'c' && (event.ctrlKey || event.metaKey)) {
        if (selectedItems.size > 0) {
          event.preventDefault();
          handleCopy();
        }
      } else if (event.key === 'x' && (event.ctrlKey || event.metaKey)) {
        if (selectedItems.size > 0) {
          event.preventDefault();
          handleCut();
        }
      } else if (event.key === 'v' && (event.ctrlKey || event.metaKey)) {
        if (clipboard?.items?.length > 0) {
          event.preventDefault();
          handlePaste();
        }
      } else if (event.key === 'F2') {
        event.preventDefault();
        if (selectedItems.size === 1) {
          const item = currentFiles.find((file) => file.id === Array.from(selectedItems)[0]);
          if (item) startRename(item);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAdmin, currentFiles, selectedItems, setSelectedItems, clipboard,
    handleCopy, handleCut, handlePaste, startRename, renamingItem,
    showFolderModal, showDeleteModal, previewFile, setShowDeleteModal,
  ]);
}
