import test from 'node:test';
import assert from 'node:assert/strict';
import { File } from 'node:buffer';

import FileTransfer from '../src/modules/P2P/transfers/FileTransfer.js';
import { DEFAULT_CHUNK_SIZE, decodeFileChunk, encodeFileChunk } from '../src/modules/P2P/transfers/protocol.js';
import { decodeSignalToken, encodeSignalToken, parseSignal } from '../src/modules/P2P/core/WebRTCCore.js';
import WebRTCCore from '../src/modules/P2P/core/WebRTCCore.js';

class FakeCore {
  constructor() {
    this.listeners = new Set();
    this.sent = [];
    this.maxPendingAcks = 0;
    this.fileChannel = new EventTarget();
    this.fileChannel.readyState = 'open';
    this.fileChannel.bufferedAmount = 0;
    this.legacyReceiver = false;
  }

  onMessage(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  send(data) {
    this.sent.push(data);
    let message;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    if (message.type === 'FILE_START' && this.transfer) {
      setTimeout(() => {
        for (const listener of this.listeners) {
          const response = { type: 'FILE_READY', fileId: message.fileId };
          if (!this.legacyReceiver) response.maxChunkSize = DEFAULT_CHUNK_SIZE;
          listener(JSON.stringify(response), 'windhub-control');
        }
      }, 0);
    }
    if (message.type === 'FILE_CONFIG' && this.transfer) {
      setTimeout(() => {
        for (const listener of this.listeners) {
          listener(JSON.stringify({
            type: 'FILE_CONFIG_ACK',
            fileId: message.fileId,
            chunkSize: message.chunkSize,
          }), 'windhub-control');
        }
      }, 0);
    }
  }

  getMaxFileChunkSize() {
    return DEFAULT_CHUNK_SIZE;
  }

  sendFile(data) {
    this.sent.push(data);
    this.maxPendingAcks = Math.max(this.maxPendingAcks, this.transfer?.outgoing?.pendingAcks.size || 0);
    data.arrayBuffer().then((frame) => {
      const { metadata } = decodeFileChunk(frame);
      if ((metadata.chunkIndex + 1) % 4 !== 0 && metadata.chunkIndex + 1 !== this.transfer.outgoing.metadata.totalChunks) return;
      const receivedBytes = Math.min(
        (metadata.chunkIndex + 1) * metadata.chunkSize,
        this.transfer.outgoing.metadata.fileSize,
      );
      setTimeout(() => {
        for (const listener of this.listeners) {
          listener(JSON.stringify({
            type: 'ACK',
            fileId: metadata.fileId,
            chunkIndex: metadata.chunkIndex,
            receivedBytes,
          }), 'windhub-control');
        }
      });
    });
  }
}

test('receiver acknowledges a valid file chunk', () => {
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
  }, new Uint8Array(10));

  transfer.receiveChunk(chunk);

  assert.deepEqual(JSON.parse(core.sent.at(-1)), {
    type: 'ACK',
    fileId: 'file-1',
    chunkIndex: 0,
    receivedBytes: 10,
  });
});

test('file chunk decoding returns a payload view without an extra copy', () => {
  const payload = new Uint8Array([3, 1, 4, 1, 5]);
  const frame = encodeFileChunk({
    type: 'FILE_CHUNK',
    fileId: 'view-test',
    chunkIndex: 0,
    chunkSize: 16 * 1024,
  }, payload);
  const decoded = decodeFileChunk(new Uint8Array(frame));

  assert.equal(decoded.data.buffer, frame);
  assert.deepEqual(Array.from(decoded.data), Array.from(payload));
});

test('file sender negotiates 256 KiB chunks and pipelines by an 8 MiB ACK window', async () => {
  const core = new FakeCore();
  const progress = [];
  const transfer = new FileTransfer(core, { onProgress: (value) => progress.push(value) });
  core.transfer = transfer;
  const fileSize = 10 * 1024 * 1024;
  await transfer.sendFile(new File(['a'.repeat(fileSize)], 'sample.bin'));

  assert.equal(core.sent.length, 43);
  assert.equal(JSON.parse(core.sent[0]).type, 'FILE_START');
  assert.equal(JSON.parse(core.sent[0]).chunkSize, 64 * 1024);
  assert.equal(JSON.parse(core.sent[1]).type, 'FILE_CONFIG');
  assert.equal(JSON.parse(core.sent[1]).chunkSize, DEFAULT_CHUNK_SIZE);
  assert.equal(JSON.parse(core.sent.at(-1)).type, 'FILE_END');
  assert.equal(core.sent[2] instanceof Blob, true);
  assert.equal(core.maxPendingAcks, 32);
  assert.equal(progress.at(-1).status, 'sent');
  assert.equal(progress.at(-1).transferred, fileSize);
  assert.equal(transfer.outgoing, null);
});

test('sender falls back to 64 KiB for older peers without chunk capability negotiation', async () => {
  const core = new FakeCore();
  core.legacyReceiver = true;
  const transfer = new FileTransfer(core);
  core.transfer = transfer;
  await transfer.sendFile(new File(['x'.repeat(100_000)], 'older-peer.bin'));

  assert.equal(core.sent.some((message) => typeof message === 'string' && JSON.parse(message).type === 'FILE_CONFIG'), false);
  assert.equal(core.sent.filter((message) => message instanceof Blob).length, 2);
});

test('zero-byte files complete without producing a chunk', async () => {
  const core = new FakeCore();
  const progress = [];
  const received = [];
  const sender = new FileTransfer(core, { onProgress: (value) => progress.push(value) });
  core.transfer = sender;
  await sender.sendFile(new File([], 'empty.txt', { type: 'text/plain' }));

  assert.equal(core.sent.length, 3);
  assert.equal(JSON.parse(core.sent[0]).totalChunks, 0);
  assert.equal(JSON.parse(core.sent[1]).type, 'FILE_CONFIG');
  assert.equal(JSON.parse(core.sent[2]).type, 'FILE_END');
  assert.equal(progress.at(-1).status, 'sent');

  const receiver = new FileTransfer(new FakeCore(), { onReceived: (file) => received.push(file) });
  receiver.receive(core.sent[0], 'windhub-control');
  receiver.receive(core.sent[1], 'windhub-control');
  receiver.receive(core.sent[2], 'windhub-control');
  assert.equal(received.length, 1);
  assert.equal(received[0].blob.size, 0);
});

test('cancelling while waiting for buffer space wakes the sender', async () => {
  const core = new FakeCore();
  core.fileChannel.bufferedAmount = 600 * 1024;
  const progress = [];
  const transfer = new FileTransfer(core, { onProgress: (value) => progress.push(value) });
  const sending = transfer.sendFile(new File(['pending'], 'pending.bin'));

  await new Promise((resolve) => setTimeout(resolve, 0));
  const fileId = transfer.outgoing.metadata.fileId;
  transfer.cancelTransfer(fileId);

  await assert.rejects(sending, { name: 'AbortError' });
  assert.equal(progress.at(-1).status, 'cancelled');
  assert.equal(transfer.outgoing, null);
});

test('cancelling while waiting for a receiver ACK does not leave the send pending', async () => {
  const core = new FakeCore();
  const progress = [];
  const transfer = new FileTransfer(core, { onProgress: (value) => progress.push(value) });
  core.transfer = transfer;
  core.sendFile = (frame) => core.sent.push(frame);
  const sending = transfer.sendFile(new File(['pending ack'], 'waiting.bin'));

  for (let attempt = 0; attempt < 20 && !transfer.outgoing?.pendingAcks.size; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  assert.equal(transfer.outgoing.pendingAcks.size, 1);
  assert.equal(progress.at(-1).transferred, 0);
  assert.equal(core.sent.some((message) => typeof message === 'string' && JSON.parse(message).type === 'FILE_END'), false);

  transfer.cancelTransfer(transfer.outgoing.metadata.fileId);
  await assert.rejects(sending, { name: 'AbortError' });
  assert.equal(progress.at(-1).status, 'cancelled');
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

test('offerer creates reliable ordered data channels', async () => {
  const previousPeerConnection = globalThis.RTCPeerConnection;
  const optionsByLabel = new Map();

  class FakeDataChannel extends EventTarget {
    constructor(label) {
      super();
      this.label = label;
      this.readyState = 'connecting';
      this.bufferedAmount = 0;
    }

    close() {
      this.readyState = 'closed';
    }
  }

  class FakePeerConnection extends EventTarget {
    constructor() {
      super();
      this.iceGatheringState = 'complete';
      this.connectionState = 'new';
      this.iceConnectionState = 'new';
      this.signalingState = 'stable';
    }

    createDataChannel(label, options) {
      optionsByLabel.set(label, options);
      return new FakeDataChannel(label);
    }

    async createOffer() {
      return { type: 'offer', sdp: 'offer-sdp' };
    }

    async setLocalDescription(description) {
      this.localDescription = description;
      this.signalingState = 'have-local-offer';
    }

    close() {}
  }

  globalThis.RTCPeerConnection = FakePeerConnection;
  try {
    const core = new WebRTCCore();
    await core.createOffer();

    for (const label of ['windhub-control', 'windhub-file']) {
      assert.deepEqual(optionsByLabel.get(label), { ordered: true });
      assert.equal('maxRetransmits' in optionsByLabel.get(label), false);
    }
    core.close();
  } finally {
    if (previousPeerConnection === undefined) delete globalThis.RTCPeerConnection;
    else globalThis.RTCPeerConnection = previousPeerConnection;
  }
});

test('connection stats report the selected direct candidate pair and transport metrics', async () => {
  const previousPeerConnection = globalThis.RTCPeerConnection;

  class FakePeerConnection extends EventTarget {
    constructor() {
      super();
      this.stats = new Map([
        ['transport-1', { type: 'transport', selectedCandidatePairId: 'pair-1' }],
        ['pair-1', {
          type: 'candidate-pair',
          state: 'succeeded',
          nominated: true,
          localCandidateId: 'local-1',
          remoteCandidateId: 'remote-1',
          bytesSent: 1234,
          bytesReceived: 5678,
          packetsSent: 12,
          packetsReceived: 34,
          retransmittedPacketsSent: 2,
          currentRoundTripTime: 0.025,
          availableOutgoingBitrate: 800_000,
        }],
        ['local-1', { candidateType: 'host', protocol: 'udp' }],
        ['remote-1', { candidateType: 'srflx', protocol: 'udp' }],
      ]);
    }

    addEventListener() {}

    async getStats() {
      return this.stats;
    }

    close() {}
  }

  globalThis.RTCPeerConnection = FakePeerConnection;
  try {
    const core = new WebRTCCore();
    assert.deepEqual(await core.getConnectionStats(), {
      path: 'direct',
      protocol: 'udp',
      localCandidateType: 'host',
      remoteCandidateType: 'srflx',
      bytesSent: 1234,
      bytesReceived: 5678,
      packetsSent: 12,
      packetsReceived: 34,
      retransmittedPacketsSent: 2,
      roundTripTime: 0.025,
      availableOutgoingBitrate: 800_000,
    });
    core.close();
  } finally {
    if (previousPeerConnection === undefined) delete globalThis.RTCPeerConnection;
    else globalThis.RTCPeerConnection = previousPeerConnection;
  }
});
