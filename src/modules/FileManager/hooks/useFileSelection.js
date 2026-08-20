export function useFileSelection({ handleOpenFolder, handlePreview, renamingItem, setSelectedItems }) {

  const handleItemClick = (event, item) => {
    if (renamingItem === item.id) return;
    if (event.ctrlKey || event.metaKey) {
      setSelectedItems((current) => {
        const next = new Set(current);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
      return;
    }

    setSelectedItems(new Set([item.id]));
    if (item.type === 'folder') handleOpenFolder(item);
    else handlePreview(item);
  };

  const handleItemDoubleClick = (item) => {
    if (renamingItem === item.id) return;
    if (item.type === 'folder') handleOpenFolder(item);
    else handlePreview(item);
  };

  const handleDragStart = (event, item) => {
    setSelectedItems((current) => current.has(item.id) ? current : new Set([item.id]));
    event.dataTransfer.setData('text/plain', item.id);
  };

  return { handleItemClick, handleItemDoubleClick, handleDragStart };
}
