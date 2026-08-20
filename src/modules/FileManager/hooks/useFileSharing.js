// src/modules/FileManager/hooks/useFileSharing.js
import { toast } from 'sonner';
import { createShareUrl } from '../utils/shareUtils';

export function useFileSharing() {
  const handleShare = async (item) => {
    if (!item) return;
    try {
      const shareUrl = createShareUrl(window.location.origin, item);
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Đã sao chép liên kết chia sẻ!');
    } catch (error) {
      toast.error('Không thể sao chép liên kết');
      console.error(error);
    }
  };

  return { handleShare };
}