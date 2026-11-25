export function createShareUrl(origin, item) {
  const parameter = item.type === 'folder' ? 'folderId' : 'fileId';
  const searchParams = new URLSearchParams({ [parameter]: item.id });
  return `${origin}/files?${searchParams.toString()}`;
}

/**
 * Pure state-machine decision for resolving shared ?fileId / ?folderId links:
 * - Returns 'found-file' or 'found-folder' immediately if present in `allFiles` (even from cache).
 * - Returns 'wait-for-server' if missing in `allFiles` while `isServerSynced` is still false
 *   (preventing false "File không tồn tại" errors on stale localStorage cache).
 * - Returns 'verify-direct' once `isServerSynced` is true and the item is still not in `allFiles`.
 */
export function resolveSharedItemState({ allFiles = [], fileId, folderId, isLoading, isServerSynced }) {
  if ((!fileId && !folderId) || isLoading) {
    return { status: 'idle', item: null };
  }

  if (fileId) {
    const sharedFile = allFiles.find((file) => file.id === fileId && file.type !== 'folder');
    if (sharedFile) {
      return { status: 'found-file', item: sharedFile };
    }
    return { status: isServerSynced ? 'verify-direct' : 'wait-for-server', item: null };
  }

  if (folderId) {
    const sharedFolder = allFiles.find((file) => file.id === folderId && file.type === 'folder');
    if (sharedFolder) {
      return { status: 'found-folder', item: sharedFolder };
    }
    return { status: isServerSynced ? 'verify-direct' : 'wait-for-server', item: null };
  }

  return { status: 'idle', item: null };
}
