import test from 'node:test';
import assert from 'node:assert/strict';

import FileTransfer from '../src/modules/P2P/transfers/FileTransfer.js';
import { decodeControl, encodeFileChunk } from '../src/modules/P2P/transfers/protocol.js';
import { decodeSignalToken, encodeSignalToken, parseSignal } from '../src/modules/P2P/core/WebRTCCore.js';
import WebRTCCore from '../src/modules/P2P/core/WebRTCCore.js';

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

test('pairing token remains compact and reversible', () => {
  const sdp = 'v=0\r\n' + 'a=ice-ufrag:abc\r\n'.repeat(220);
  const description = { version: 1, type: 'offer', sdp };
  const token = encodeSignalToken(description);

  assert.match(token, /^v1\./);
  assert.ok(token.length < JSON.stringify(description).length, `expected compact token: ${token.length} >= ${JSON.stringify(description).length}`);
  assert.deepEqual(decodeSignalToken(token), description);
  assert.deepEqual(parseSignal(token, 'offer'), { type: 'offer', sdp });
});

test('answerer reuses offered data channels and includes gathered ICE in answer', async () => {
  const previousPeerConnection = globalThis.RTCPeerConnection;
  const listeners = new Map();
  let createdChannels = 0;

  class FakePeerConnection {
    constructor() {
      this.iceGatheringState = 'complete';
      this.connectionState = 'new';
      this.iceConnectionState = 'new';
      this.signalingState = 'stable';
      this.localDescription = null;
    }

    addEventListener(type, listener) {
      listeners.set(type, listener);
    }

    removeEventListener() {}

    createDataChannel() {
      createdChannels += 1;
      throw new Error('Answerer must reuse channels created by offerer.');
    }

    async setRemoteDescription(description) {
      this.remoteDescription = description;
    }

    async createAnswer() {
      return { type: 'answer', sdp: 'answer-sdp' };
    }

    async setLocalDescription(description) {
      this.localDescription = { ...description, sdp: `${description.sdp}\r\na=candidate:gathered` };
    }

    close() {}
  }

  globalThis.RTCPeerConnection = FakePeerConnection;
  try {
    const core = new WebRTCCore();
    const answerToken = await core.createAnswer(encodeSignalToken({
      version: 1,
      type: 'offer',
      sdp: 'offer-sdp',
    }));

    assert.equal(createdChannels, 0);
    assert.deepEqual(parseSignal(answerToken, 'answer'), {
      type: 'answer',
      sdp: 'answer-sdp\r\na=candidate:gathered',
    });
    core.close();
  } finally {
    if (previousPeerConnection === undefined) delete globalThis.RTCPeerConnection;
    else globalThis.RTCPeerConnection = previousPeerConnection;
  }
});
