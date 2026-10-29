import test from 'node:test';
import assert from 'node:assert/strict';
import { createShareUrl } from '../src/modules/FileManager/utils/shareUtils.js';
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
