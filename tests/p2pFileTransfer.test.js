import test from 'node:test';
import assert from 'node:assert/strict';

import FileTransfer from '../src/modules/P2P/transfers/FileTransfer.js';
import { decodeControl, encodeFileChunk } from '../src/modules/P2P/transfers/protocol.js';

class FakeCore {
  constructor() {
    this.listeners = new Set();
    this.sent = [];
  }

  onMessage(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  send(data) {
    this.sent.push(data);
  }

  sendFile(data) {
    this.sent.push(data);
  }
}

test('receiver sends ACK after accepting a file chunk', () => {
  const core = new FakeCore();
  const transfer = new FileTransfer(core);
  transfer.startReceive({
    type: 'FILE_START',
    fileId: 'file-1',
    fileName: 'demo.txt',
    fileSize: 10,
    mimeType: 'text/plain',
    totalChunks: 1,
    chunkSize: 16 * 1024,
    createdAt: Date.now(),
  });

  const chunk = encodeFileChunk({
    type: 'FILE_CHUNK',
    fileId: 'file-1',
    chunkIndex: 0,
    chunkSize: 16 * 1024,
  }, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));

  transfer.receiveChunk(chunk);

  assert.equal(core.sent.length, 1);
  assert.deepEqual(decodeControl(core.sent[0]), {
    type: 'ACK',
    fileId: 'file-1',
    chunkIndex: 0,
  });
});

test('ACK control updates outgoing transfer state', () => {
  const core = new FakeCore();
  const transfer = new FileTransfer(core);
  transfer.outgoing = { metadata: { fileId: 'file-2' } };

  transfer.receive(JSON.stringify({ type: 'ACK', fileId: 'file-2', chunkIndex: 0 }), 'windhub-control');

  assert.equal(transfer.outgoing.transferAcknowledged, true);
});
