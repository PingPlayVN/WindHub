import { useState } from 'react';
import { toast } from 'sonner';
import { detectFileType, formatDownloadLink, getDescendantIds, wouldCreateFolderLoop } from '../utils/fileUtils';
import { uploadUrlToCloudinary } from '@/services/thumbnail';
import { removeFile, updateFile } from '../services/fileService';

export function useFileOrganization({ isAdmin, activeTab, allFiles, selectedItems, setSelectedItems }) {
  const [renamingItem, setRenamingItem] = useState(null);
  const [renameText, setRenameText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDrop = async (event, targetFolder) => {
    event.preventDefault();
    if (!isAdmin || targetFolder.type !== 'folder') return;

    const draggedItemId = event.dataTransfer.getData('text/plain');
    const idsToMove = selectedItems.has(draggedItemId) ? selectedItems : new Set([draggedItemId]);
    const itemsToMove = allFiles.filter((file) => idsToMove.has(file.id));

    if (wouldCreateFolderLoop(allFiles, targetFolder.id, itemsToMove)) {
      toast.error('Không thể di chuyển thư mục vào chính nó hoặc thư mục con');
      return;
    }

    try {
      await Promise.all(Array.from(idsToMove).map((id) => (
        id === targetFolder.id
          ? Promise.resolve()
          : updateFile(id, { parentId: targetFolder.id })
      )));
      setSelectedItems(new Set());
      toast.success('Đã di chuyển tài nguyên');
    } catch (error) {
      console.error('Lỗi kéo thả:', error);
      toast.error('Không thể di chuyển tài nguyên. Vui lòng thử lại.');
    }
  };

  const startRename = (item) => {
    setRenamingItem(item.id);
    setRenameText(item.name);
  };

  const handleRenameSubmit = async (event, id) => {
    event.preventDefault();
    if (!isAdmin) return;

    const targetItem = allFiles.find((file) => file.id === id);
    const newName = renameText.trim();
    if (!newName || newName === targetItem?.name) {
      setRenamingItem(null);
      return;
    }

    try {
      await updateFile(id, { name: newName });
    } catch (error) {
      console.error('Lỗi Rename:', error);
      toast.error('Không thể đổi tên tài nguyên. Vui lòng thử lại.');
    }
    setRenamingItem(null);
  };

  const confirmDelete = async () => {
    if (!isAdmin) return;
    try {
      const idsToDelete = getDescendantIds(allFiles, Array.from(selectedItems));
      await Promise.all(Array.from(idsToDelete).map((id) => removeFile(id)));
      setSelectedItems(new Set());
      toast.success('Đã xóa tài nguyên');
    } catch (error) {
      console.error('Lỗi xóa:', error);
      toast.error('Không thể xóa tài nguyên. Vui lòng thử lại.');
    } finally {
      setShowDeleteModal(false);
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
      await updateFile(item.id, {
        url: finalUrl,
        type: detectFileType(finalUrl, activeTab),
      });

      if ((finalUrl.includes('drive.google.com') || finalUrl.includes('docs.google.com'))
        && ['video', 'image', 'document'].includes(activeTab) && !item.thumbnailUrl) {
        const match = finalUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || finalUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (match?.[1]) uploadUrlToCloudinary(item.id, `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`);
      }
      toast.success('Đã cập nhật liên kết');
    } catch {
      toast.error('Liên kết không hợp lệ');
    }
  };

  const handleToggleLock = async (item) => {
    if (!isAdmin) return;
    try {
      await updateFile(item.id, { isLocked: !item.isLocked });
      toast.success(item.isLocked ? 'Đã mở khóa file' : 'Đã khóa file');
    } catch {
      toast.error('Không thể cập nhật trạng thái file');
    }
  };

  return {
    renamingItem, renameText, setRenameText, showDeleteModal, setShowDeleteModal,
    handleDrop, startRename, handleRenameSubmit, confirmDelete, startEditLink, handleToggleLock,
  };
}
