export function formatDownloadLink(url, currentTab) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes('dropbox.com')) {
      parsedUrl.searchParams.set('dl', '1');
      return parsedUrl.href;
    }
    if (parsedUrl.hostname.includes('drive.google.com') || parsedUrl.hostname.includes('docs.google.com')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match?.[1]) {
        return currentTab === 'other'
          ? `https://drive.google.com/uc?export=download&id=${match[1]}`
          : `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    return url;
  } catch {
    return url;
  }
}

export function detectFileType(url, currentTab) {
  try {
    const extension = url.split('.').pop().toLowerCase().split('?')[0];
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'flac'].includes(extension)) return 'audio';
    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv'].includes(extension)) return 'document';
    if (currentTab && currentTab !== 'all' && currentTab !== 'other') return currentTab;
    return 'raw';
  } catch {
    return 'raw';
  }
}

export function getDescendantIds(allFiles, rootIds) {
  const ids = new Set(rootIds);
  let foundNewItem = true;
  while (foundNewItem) {
    foundNewItem = false;
    allFiles.forEach((item) => {
      if (ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id);
        foundNewItem = true;
      }
    });
  }
  return ids;
}

export function wouldCreateFolderLoop(allFiles, targetFolderId, items) {
  return items.some((item) => item.type === 'folder' && getDescendantIds(allFiles, [item.id]).has(targetFolderId));
}
