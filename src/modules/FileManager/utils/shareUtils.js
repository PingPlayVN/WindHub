export function createShareUrl(origin, item) {
  const parameter = item.type === 'folder' ? 'folderId' : 'fileId';
  const searchParams = new URLSearchParams({ [parameter]: item.id });
  return `${origin}/files?${searchParams.toString()}`;
}