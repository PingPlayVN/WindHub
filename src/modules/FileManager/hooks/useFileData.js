import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, query, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

export function useFileData(currentFolderId, searchTerm) {
  const [allFiles, setAllFiles] = useState([]);
  const [globalSort, setGlobalSort] = useState({});
  const [localSort, setLocalSort] = useState({});
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'windhub_settings', 'sort_config'), (snapshot) => {
      if (snapshot.exists()) setGlobalSort(snapshot.data());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'windhub_files')),
      (snapshot) => {
        setAllFiles(snapshot.docs.map((file) => ({ id: file.id, ...file.data() })));
        setLoadError('');
      },
      () => setLoadError('Không thể tải tài nguyên. Vui lòng thử lại sau.'),
    );
    return unsubscribe;
  }, []);

  const effectiveSort = localSort[currentFolderId] || globalSort[currentFolderId] || 'newest';

  const currentFiles = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
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
  }, [allFiles, currentFolderId, effectiveSort, searchTerm]);

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
    await setDoc(doc(db, 'windhub_settings', 'sort_config'), { [currentFolderId]: nextSort }, { merge: true });
  };

  return {
    allFiles,
    currentFiles,
    effectiveSort,
    globalSort,
    loadError,
    setAllFiles,
    handleLocalSortChange,
    handleGlobalSortChange,
  };
}
