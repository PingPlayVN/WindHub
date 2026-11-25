import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { fetchFileById } from '../../services/fileService';
import { resolveSharedItemState } from '../../utils/shareUtils';

export function useSharedItemLink({
  allFiles,
  isLoading,
  isServerSynced = true,
  loadError,
  searchParams,
  setSearchParams,
  handlePreview,
  handleOpenSharedFolder,
}) {
  const processedShareRef = useRef('');
  const verifyingRef = useRef('');

  useEffect(() => {
    const fileId = searchParams.get('fileId');
    const folderId = searchParams.get('folderId');
    const shareKey = `${fileId || ''}:${folderId || ''}`;

    if ((!fileId && !folderId) || loadError || processedShareRef.current === shareKey) {
      return undefined;
    }

    const clearShareParams = () => {
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('fileId');
      nextSearchParams.delete('folderId');
      if (nextSearchParams.toString() !== searchParams.toString()) {
        setSearchParams(nextSearchParams, { replace: true });
      }
    };

    const decision = resolveSharedItemState({
      allFiles,
      fileId,
      folderId,
      isLoading,
      isServerSynced,
    });

    if (decision.status === 'idle' || decision.status === 'wait-for-server') {
      return undefined;
    }

    if (decision.status === 'found-file') {
      processedShareRef.current = shareKey;
      handlePreview(decision.item);
      clearShareParams();
      return undefined;
    }

    if (decision.status === 'found-folder') {
      const opened = handleOpenSharedFolder(decision.item, allFiles);
      if (opened) {
        processedShareRef.current = shareKey;
        clearShareParams();
        return undefined;
      }
      // Ancestor folders might still be missing in stale cache — wait for server sync!
      if (!isServerSynced) {
        return undefined;
      }
      processedShareRef.current = shareKey;
      toast.error('Không xác định được vị trí của thư mục');
      clearShareParams();
      return undefined;
    }

    // decision.status === 'verify-direct'
    if (verifyingRef.current === shareKey) return undefined;
    verifyingRef.current = shareKey;

    let cancelled = false;
    (async () => {
      if (fileId) {
        const directFile = await fetchFileById(fileId);
        if (cancelled) return;
        processedShareRef.current = shareKey;
        if (directFile && directFile.type !== 'folder') {
          handlePreview(directFile);
        } else {
          toast.error('File không tồn tại hoặc đã bị xóa');
        }
        clearShareParams();
        return;
      }

      if (folderId) {
        const directFolder = await fetchFileById(folderId);
        if (cancelled) return;
        processedShareRef.current = shareKey;
        if (directFolder && directFolder.type === 'folder') {
          const merged = allFiles.some((f) => f.id === directFolder.id)
            ? allFiles
            : [...allFiles, directFolder];
          if (!handleOpenSharedFolder(directFolder, merged)) {
            toast.error('Không xác định được vị trí của thư mục');
          }
        } else {
          toast.error('Thư mục không tồn tại hoặc đã bị xóa');
        }
        clearShareParams();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    allFiles,
    isLoading,
    isServerSynced,
    loadError,
    searchParams,
    setSearchParams,
    handlePreview,
    handleOpenSharedFolder,
  ]);
}
