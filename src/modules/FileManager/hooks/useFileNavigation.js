import { useCallback, useState } from 'react';

export const FILE_TABS = [
  { id: 'video', label: 'Video', rootId: 'root_video' },
  { id: 'image', label: 'Hình ảnh', rootId: 'root_image' },
  { id: 'document', label: 'Tài liệu', rootId: 'root_document' },
  { id: 'other', label: 'File khác', rootId: 'root_other' },
];

export function useFileNavigation() {
  const initialTab = FILE_TABS[0];
  const [activeTab, setActiveTab] = useState(initialTab.id);
  const [currentFolder, setCurrentFolder] = useState({ id: initialTab.rootId, name: initialTab.label });
  const [path, setPath] = useState([{ id: initialTab.rootId, name: initialTab.label }]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab.id);
    setCurrentFolder({ id: tab.rootId, name: tab.label });
    setPath([{ id: tab.rootId, name: tab.label }]);
  }, []);

  const handleOpenFolder = useCallback((folder) => {
    setCurrentFolder({ id: folder.id, name: folder.name });
    setPath((currentPath) => [...currentPath, { id: folder.id, name: folder.name }]);
  }, []);

  const handleOpenSharedFolder = useCallback((folder, allFiles) => {
    const ancestors = [];
    const visited = new Set();
    let rootId = folder.parentId;
    let current = folder;

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      ancestors.unshift({ id: current.id, name: current.name });
      rootId = current.parentId || rootId;
      current = allFiles.find((file) => file.id === current.parentId);
    }

    const rootTab = FILE_TABS.find((tab) => rootId === tab.rootId);
    if (!rootTab) return false;

    setActiveTab(rootTab.id);
    setPath([{ id: rootTab.rootId, name: rootTab.label }, ...ancestors]);
    setCurrentFolder(ancestors[ancestors.length - 1]);
    return true;
  }, []);

  const handleNavigateTo = useCallback((index) => {
    const nextPath = path.slice(0, index + 1);
    setPath(nextPath);
    setCurrentFolder(nextPath[nextPath.length - 1]);
  }, [path]);

  return {
    TABS: FILE_TABS,
    activeTab,
    currentFolder,
    path,
    handleTabChange,
    handleOpenFolder,
    handleOpenSharedFolder,
    handleNavigateTo,
  };
}
