import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { saveGlobalSort, subscribeToFiles, subscribeToSortConfig } from '../services/fileService';

export function useFileData(currentFolderId, searchTerm) {
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [allFiles, setAllFiles] = useState([]);
  const [globalSort, setGlobalSort] = useState({});
  const [localSort, setLocalSort] = useState({});
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    return subscribeToSortConfig(setGlobalSort);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    return subscribeToFiles((files) => {
      setAllFiles(files);
      setLoadError('');
      setIsLoading(false);
    }, () => {
      setLoadError('Không thể tải tài nguyên. Vui lòng thử lại sau.');
      setIsLoading(false);
    });
  }, []);

  const effectiveSort = localSort[currentFolderId] || globalSort[currentFolderId] || 'newest';

  const currentFiles = useMemo(() => {
    const normalizedSearchTerm = deferredSearchTerm.trim().toLocaleLowerCase();
    return allFiles
      .filter((file) => {
        const matchesFolder = (file.parentId || 'root') === currentFolderId;
        const matchesSearch = !normalizedSearchTerm || file.name?.toLocaleLowerCase().includes(normalizedSearchTerm);
        return matchesFolder && matchesSearch;
      })
      .sort((first, second) => {
        if (first.type === 'folder' && second.type !== 'folder') return -1;
        if (first.type !== 'folder' && second.type === 'folder') return 1;
        if (effectiveSort === 'oldest') return (first.timestamp || 0) - (second.timestamp || 0);
        if (effectiveSort === 'name-asc') return (first.name || '').localeCompare(second.name || '', 'vi', { numeric: true });
        if (effectiveSort === 'name-desc') return (second.name || '').localeCompare(first.name || '', 'vi', { numeric: true });
        return (second.timestamp || 0) - (first.timestamp || 0);
      });
  }, [allFiles, currentFolderId, deferredSearchTerm, effectiveSort]);

  const handleLocalSortChange = (nextSort) => {
    setLocalSort((current) => ({ ...current, [currentFolderId]: nextSort }));
  };

  const handleGlobalSortChange = async (nextSort, isAdmin) => {
    if (!isAdmin) return;
    setLocalSort((current) => {
      const next = { ...current };
      delete next[currentFolderId];
      return next;
    });
    await saveGlobalSort(currentFolderId, nextSort);
  };

  return {
    allFiles,
    currentFiles,
    effectiveSort,
    globalSort,
    loadError,
    isLoading,
    handleLocalSortChange,
    handleGlobalSortChange,
  };
}
