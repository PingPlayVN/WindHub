import { useState } from 'react';
import { toast } from 'sonner';

export function useFilePreview({ isAdmin }) {
  const [previewFile, setPreviewFile] = useState(null);
  const [viewerEngine, setViewerEngine] = useState('microsoft');

  const handlePreview = (item) => {
    setViewerEngine('microsoft');
    setPreviewFile(item);
  };

  const handleDownload = (item) => {
    if (item.isLocked) return toast.error('Tập tin này đang khóa, không thể tải xuống!');
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async (item) => {
    if (!isAdmin) return;
    try {
      await navigator.clipboard.writeText(item.url);
      toast.success('Đã sao chép liên kết');
    } catch {
      toast.error('Không thể sao chép liên kết');
    }
  };

  return {
    previewFile, setPreviewFile, viewerEngine, setViewerEngine,
    handlePreview, handleDownload, handleCopyLink,
  };
}
