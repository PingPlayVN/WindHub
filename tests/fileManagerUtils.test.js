import test from 'node:test';
import assert from 'node:assert/strict';
import { createShareUrl, resolveSharedItemState } from '../src/modules/FileManager/utils/shareUtils.js';
import { getStoredFilesInRoot, isStoredFile, wouldCreateFolderLoop } from '../src/modules/FileManager/utils/fileUtils.js';

test('counts only stored files with a URL', () => {
  assert.equal(isStoredFile({ type: 'video', url: 'https://example.com/video.mp4' }), true);
  assert.equal(isStoredFile({ type: 'document', url: 'https://example.com/file.pdf' }), true);
  assert.equal(isStoredFile({ type: 'folder' }), false);
  assert.equal(isStoredFile({ type: 'video' }), false);
  assert.equal(isStoredFile({ type: 'document', url: '  ' }), false);
});

test('counts stored files only inside the matching root tree', () => {
  const files = [
    { id: 'video-1', type: 'video', url: 'https://example.com/1.mp4', parentId: 'root_video' },
    { id: 'folder-1', type: 'folder', parentId: 'root_video' },
    { id: 'video-2', type: 'video', url: 'https://example.com/2.mp4', parentId: 'folder-1' },
    { id: 'orphan-video', type: 'video', url: 'https://example.com/orphan.mp4', parentId: 'root_document' },
  ];

  assert.deepEqual(
    getStoredFilesInRoot(files, 'root_video').map((file) => file.id),
    ['video-1', 'video-2'],
  );
});

test('creates file and folder share URLs with encoded query parameters', () => {
  assert.equal(
    createShareUrl('https://windhub.example', { id: 'file/1', type: 'video' }),
    'https://windhub.example/files?fileId=file%2F1',
  );
  assert.equal(
    createShareUrl('https://windhub.example', { id: 'folder-1', type: 'folder' }),
    'https://windhub.example/files?folderId=folder-1',
  );
});

test('prevents moving a folder into one of its descendants', () => {
  const files = [
    { id: 'folder-a', type: 'folder', parentId: 'root_video' },
    { id: 'folder-b', type: 'folder', parentId: 'folder-a' },
  ];

  assert.equal(
    wouldCreateFolderLoop(files, 'folder-b', [files[0]]),
    true,
  );
  assert.equal(
    wouldCreateFolderLoop(files, 'root_image', [files[0]]),
    false,
  );
});

test('waits for server sync instead of failing when shared file is missing from stale localStorage cache', () => {
  const staleCache = [{ id: 'old-file', type: 'document', url: 'https://example.com/old.pdf' }];

  const firstPass = resolveSharedItemState({
    allFiles: staleCache,
    fileId: 'new-shared-file',
    folderId: null,
    isLoading: false,
    isServerSynced: false,
  });
  assert.equal(firstPass.status, 'wait-for-server');

  const serverPass = resolveSharedItemState({
    allFiles: [...staleCache, { id: 'new-shared-file', type: 'document', url: 'https://example.com/new.pdf' }],
    fileId: 'new-shared-file',
    folderId: null,
    isLoading: false,
    isServerSynced: true,
  });
  assert.equal(serverPass.status, 'found-file');
  assert.equal(serverPass.item?.id, 'new-shared-file');

  const deletedPass = resolveSharedItemState({
    allFiles: staleCache,
    fileId: 'deleted-file',
    folderId: null,
    isLoading: false,
    isServerSynced: true,
  });
  assert.equal(deletedPass.status, 'verify-direct');
});
