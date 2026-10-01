import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useSharedItemLink({
  allFiles,
  isLoading,
  loadError,
  searchParams,
  setSearchParams,
  handlePreview,
  handleOpenSharedFolder,
}) {
  const processedShareRef = useRef('');

  useEffect(() => {
    const fileId = searchParams.get('fileId');
    const folderId = searchParams.get('folderId');
    const shareKey = `${fileId || ''}:${folderId || ''}`;

    if ((!fileId && !folderId) || isLoading || loadError || processedShareRef.current === shareKey) return;
    processedShareRef.current = shareKey;

    const nextSearchParams = new URLSearchParams(searchParams);

    if (fileId) {
      const sharedFile = allFiles.find((file) => file.id === fileId && file.type !== 'folder');
      if (sharedFile) {
        handlePreview(sharedFile);
      } else {
        toast.error('File không tồn tại hoặc đã bị xóa');
      }
      nextSearchParams.delete('fileId');
    }

    if (folderId) {
      const sharedFolder = allFiles.find((file) => file.id === folderId && file.type === 'folder');
      if (sharedFolder) {
        if (!handleOpenSharedFolder(sharedFolder, allFiles)) {
          toast.error('Không xác định được vị trí của thư mục');
        }
      } else {
        toast.error('Thư mục không tồn tại hoặc đã bị xóa');
      }
      nextSearchParams.delete('folderId');
    }

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [allFiles, isLoading, loadError, searchParams, setSearchParams, handlePreview, handleOpenSharedFolder]);
}