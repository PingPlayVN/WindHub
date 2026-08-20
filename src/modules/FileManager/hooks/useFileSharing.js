// src/modules/FileManager/hooks/useFileSharing.js
import { toast } from 'sonner';

export function useFileSharing() {
  const handleShare = async (item) => {
    if (!item) return;
    try {
      // Dùng fileId cho file thường, folderId cho thư mục
      const paramName = item.type === 'folder' ? 'folderId' : 'fileId';
      
      // Tạo link chia sẻ
      const shareUrl = `${window.location.origin}/files?${paramName}=${item.id}`;
      
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Đã sao chép liên kết chia sẻ!');
    } catch (error) {
      toast.error('Không thể sao chép liên kết');
      console.error(error);
    }
  };

  return { handleShare };
}