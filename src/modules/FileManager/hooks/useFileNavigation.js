import { useState } from 'react';

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

  const handleTabChange = (tab) => {
    setActiveTab(tab.id);
    setCurrentFolder({ id: tab.rootId, name: tab.label });
    setPath([{ id: tab.rootId, name: tab.label }]);
  };

  const handleOpenFolder = (folder) => {
    setCurrentFolder({ id: folder.id, name: folder.name });
    setPath((currentPath) => [...currentPath, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateTo = (index) => {
    const nextPath = path.slice(0, index + 1);
    setPath(nextPath);
    setCurrentFolder(nextPath[nextPath.length - 1]);
  };

  return {
    TABS: FILE_TABS,
    activeTab,
    currentFolder,
    path,
    handleTabChange,
    handleOpenFolder,
    handleNavigateTo,
  };
}
