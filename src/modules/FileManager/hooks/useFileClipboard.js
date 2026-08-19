import { useState } from 'react';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/services/firebase';
import { wouldCreateFolderLoop } from '../utils/fileUtils';

export function useFileClipboard({ isAdmin, allFiles, selectedItems, setSelectedItems, currentFolderId }) {
  const [clipboard, setClipboard] = useState(null);

  const handleCopy = () => {
    if (!isAdmin) return;
    setClipboard({ action: 'copy', items: allFiles.filter((file) => selectedItems.has(file.id)) });
    toast.success('Đã sao chép bản tạm');
  };

  const handleCut = () => {
    if (!isAdmin) return;
    setClipboard({ action: 'cut', items: allFiles.filter((file) => selectedItems.has(file.id)) });
    toast.success('Đã cắt');
  };

  const handlePaste = async () => {
    if (!isAdmin || !clipboard?.items) return;
    if (clipboard.action === 'cut' && wouldCreateFolderLoop(allFiles, currentFolderId, clipboard.items)) {
      toast.error('Không thể di chuyển thư mục vào chính nó hoặc thư mục con');
      return;
    }

    try {
      await Promise.all(clipboard.items.map(async (item) => {
        if (clipboard.action === 'cut') {
          await updateDoc(doc(db, 'windhub_files', item.id), { parentId: currentFolderId });
          return;
        }
        const dataToCopy = { ...item };
        delete dataToCopy.id;
        await addDoc(collection(db, 'windhub_files'), {
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
    }
  };

  return { clipboard, handleCopy, handleCut, handlePaste };
}
