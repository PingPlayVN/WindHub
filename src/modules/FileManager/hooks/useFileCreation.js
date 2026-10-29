import { useState } from 'react';
import { toast } from 'sonner';
import { uploadUrlToCloudinary } from '@/services/thumbnail';
import { detectFileType, formatDownloadLink } from '../utils/fileUtils';
import { createFile } from '../services/fileService';

export function useFileCreation({ isAdmin, activeTab, currentFolderId }) {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleAddLink = async (event) => {
    event.preventDefault();
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

    let extractedName = linkInput.split('/').pop().split('?')[0];
    let driveId = null;
    if (linkInput.includes('drive.google.com') || linkInput.includes('docs.google.com')) {
      const match = linkInput.match(/\/d\/([a-zA-Z0-9_-]+)/) || linkInput.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match?.[1]) {
        driveId = match[1];
        extractedName = `Google_Drive_${driveId}`;
      }
    } else {
      extractedName = decodeURIComponent(extractedName || `File_${Math.floor(Math.random() * 10000)}`);
    }

    try {
      setIsCreating(true);
      const fileRef = await createFile({
        name: extractedName,
        url: normalizedUrl,
        type: detectFileType(normalizedUrl, activeTab),
        parentId: currentFolderId,
        createdAt: new Date().toLocaleDateString('vi-VN'),
        timestamp: Date.now(),
      });

      if (driveId && ['video', 'image', 'document'].includes(activeTab)) {
        uploadUrlToCloudinary(fileRef.id, `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`);
      }

      setLinkInput('');
      setShowLinkModal(false);
      toast.success('Đã thêm tài nguyên');
    } catch (error) {
      console.error('Lỗi:', error);
      toast.error('Không thể thêm tài nguyên. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateFolder = async (event) => {
    event.preventDefault();
    if (!isAdmin) return toast.error('Chỉ admin mới có quyền quản lý file');
    if (!folderName.trim()) return;

    try {
      setIsCreating(true);
      await createFile({
        name: folderName,
        type: 'folder',
        parentId: currentFolderId,
        createdAt: new Date().toLocaleDateString('vi-VN'),
        timestamp: Date.now(),
      });
      setFolderName('');
      setShowFolderModal(false);
      toast.success('Đã tạo thư mục');
    } catch (error) {
      console.error('Lỗi:', error);
      toast.error('Không thể tạo thư mục. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  return {
    showFolderModal, setShowFolderModal, folderName, setFolderName,
    showLinkModal, setShowLinkModal, linkInput, setLinkInput,
    isCreating, handleAddLink, handleCreateFolder,
  };
}
