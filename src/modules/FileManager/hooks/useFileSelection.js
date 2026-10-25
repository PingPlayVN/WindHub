// src/modules/FileManager/hooks/useFileSelection.js
import { useState, useCallback } from 'react';

export function useFileSelection({
  handleOpenFolder,
  handlePreview,
  renamingItem,
  selectedItems,
  setSelectedItems,
}) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Chọn hoặc bỏ chọn một mục
  const toggleItemSelection = useCallback((itemId) => {
    setSelectedItems((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, [setSelectedItems]);

  // Xử lý khi chạm hoặc click vào một mục
  const handleItemClick = useCallback((event, item) => {
    if (renamingItem === item.id) return;

    // Nếu đang ở Chế độ chọn nhiều HOẶC người dùng nhấn giữ phím Ctrl/Meta trên Desktop
    if (isSelectionMode || event?.ctrlKey || event?.metaKey) {
      if (!isSelectionMode) setIsSelectionMode(true);
      toggleItemSelection(item.id);
      return;
    }

    // Chế độ duyệt bình thường: Mở file hoặc vào thư mục (KHÔNG chọn, KHÔNG hiện thanh tác vụ)
    if (item.type === 'folder') {
      setSelectedItems(new Set()); // Xóa sạch lựa chọn khi chuyển vào thư mục mới
      handleOpenFolder(item);
    } else {
      setSelectedItems(new Set([item.id]));
      handlePreview(item);
    }
  }, [renamingItem, isSelectionMode, toggleItemSelection, setSelectedItems, handleOpenFolder, handlePreview]);

  // Xử lý khi nhấn đúp chuột trên Desktop
  const handleItemDoubleClick = useCallback((item) => {
    if (renamingItem === item.id) return;
    if (item.type === 'folder') {
      setSelectedItems(new Set());
      handleOpenFolder(item);
    } else {
      handlePreview(item);
    }
  }, [renamingItem, setSelectedItems, handleOpenFolder, handlePreview]);

  // Cử chỉ nhấn giữ trên Mobile Touch (Long-press) -> Bật chế độ chọn và tick chọn tệp đó
  const handleLongPress = useCallback((item) => {
    if (renamingItem === item.id) return;
    setIsSelectionMode(true);
    setSelectedItems((current) => {
      const next = new Set(current);
      next.add(item.id);
      return next;
    });
  }, [renamingItem, setSelectedItems]);

  // Chọn tất cả hoặc bỏ chọn tất cả
  const toggleSelectAll = useCallback((files) => {
    if (!files || files.length === 0) return;
    const allSelected = files.every((f) => selectedItems.has(f.id));
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(files.map((f) => f.id)));
      setIsSelectionMode(true);
    }
  }, [selectedItems, setSelectedItems]);

  // Thoát chế độ chọn và xóa sạch lựa chọn
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  }, [setSelectedItems]);

  // Bật/tắt chế độ chọn từ Toolbar ("Chọn" <-> "Xong")
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedItems(new Set());
      }
      return next;
    });
  }, [setSelectedItems]);

  // Kéo thả chuột trên desktop
  const handleDragStart = useCallback((event, item) => {
    setSelectedItems((current) => (current.has(item.id) ? current : new Set([item.id])));
    event.dataTransfer?.setData('text/plain', item.id);
  }, [setSelectedItems]);

  return {
    isSelectionMode,
    setIsSelectionMode,
    handleItemClick,
    handleItemDoubleClick,
    handleLongPress,
    toggleItemSelection,
    toggleSelectAll,
    clearSelection,
    toggleSelectionMode,
    handleDragStart,
  };
}
