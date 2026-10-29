import { useState } from 'react';
import { toast } from 'sonner';
import { wouldCreateFolderLoop } from '../utils/fileUtils';
import { createFile, updateFile } from '../services/fileService';

export function useFileClipboard({ isAdmin, allFiles, selectedItems, setSelectedItems, currentFolderId }) {
  const [clipboard, setClipboard] = useState(null);
  const [isPasting, setIsPasting] = useState(false);

  const handleCopy = () => {
    if (!isAdmin) return;
    setClipboard({ action: 'copy', itemIds: Array.from(selectedItems) });
    toast.success('Đã sao chép bản tạm');
  };

  const handleCut = () => {
    if (!isAdmin) return;
    setClipboard({ action: 'cut', itemIds: Array.from(selectedItems) });
    toast.success('Đã cắt');
  };

  const handlePaste = async () => {
    if (!isAdmin || isPasting || !clipboard?.itemIds?.length) return;
    const clipboardItems = allFiles.filter((file) => clipboard.itemIds.includes(file.id));
    if (clipboard.action === 'cut' && wouldCreateFolderLoop(allFiles, currentFolderId, clipboardItems)) {
      toast.error('Không thể di chuyển thư mục vào chính nó hoặc thư mục con');
      return;
    }

    try {
      setIsPasting(true);
      await Promise.all(clipboardItems.map(async (item) => {
        if (clipboard.action === 'cut') {
          await updateFile(item.id, { parentId: currentFolderId });
          return;
        }
        const dataToCopy = { ...item };
        delete dataToCopy.id;
        await createFile({
          ...dataToCopy,
          name: `${dataToCopy.name} - Copy`,
          parentId: currentFolderId,
          timestamp: Date.now(),
        });
      }));
      if (clipboard.action === 'cut') setClipboard(null);
      setSelectedItems(new Set());
      toast.success('Đã dán tài nguyên');
    } catch (error) {
      console.error('Lỗi Paste:', error);
      toast.error('Không thể dán tài nguyên. Vui lòng thử lại.');
    } finally {
      setIsPasting(false);
    }
  };

  return { clipboard, isPasting, handleCopy, handleCut, handlePaste };
}
