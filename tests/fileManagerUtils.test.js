import test from 'node:test';
import assert from 'node:assert/strict';
import { createShareUrl } from '../src/modules/FileManager/utils/shareUtils.js';
import { wouldCreateFolderLoop } from '../src/modules/FileManager/utils/fileUtils.js';

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
