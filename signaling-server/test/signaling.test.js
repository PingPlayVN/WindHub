import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { WebSocket } from 'ws';

import { createSignalingServer } from '../src/index.js';

function nextMessage(socket, predicate) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.removeListener('message', onMessage);
      reject(new Error('Timed out waiting for signaling message.'));
    }, 2000);
    const onMessage = (buffer) => {
      const message = JSON.parse(buffer.toString());
      if (!predicate(message)) return;
      clearTimeout(timeout);
      socket.removeListener('message', onMessage);
      resolve(message);
    };
    socket.on('message', onMessage);
  });
}

async function connectClient(url, name) {
  const socket = new WebSocket(url, { origin: 'http://localhost' });
  await once(socket, 'open');
  const registered = nextMessage(socket, (message) => message.type === 'registered');
  socket.send(JSON.stringify({ type: 'register', name }));
  return { socket, registered: await registered };
}

test('signaling server lists online peers and relays accepted SDP only', async () => {
  const service = createSignalingServer({ port: 0, allowedOrigins: 'http://localhost' });
  const address = await service.listen();
  const url = `ws://127.0.0.1:${address.port}/p2p`;
  const clients = [];
  try {
    const first = await connectClient(url, 'Laptop');
    clients.push(first.socket);
    const secondDevices = nextMessage(first.socket, (message) => message.type === 'devices' && message.devices.length === 1);
    const second = await connectClient(url, 'Phone');
    clients.push(second.socket);
    const available = await secondDevices;
    assert.equal(available.devices[0].name, 'Phone');

    const connectionRequest = nextMessage(second.socket, (message) => message.type === 'connection-request');
    const requestSent = nextMessage(first.socket, (message) => message.type === 'request-sent');
    first.socket.send(JSON.stringify({ type: 'request', targetId: second.registered.deviceId }));
    const [request, sent] = await Promise.all([connectionRequest, requestSent]);
    assert.equal(request.from.name, 'Laptop');

    const response = nextMessage(first.socket, (message) => message.type === 'connection-response');
    second.socket.send(JSON.stringify({
      type: 'respond',
      requestId: request.requestId,
      accepted: true,
    }));
    assert.equal((await response).accepted, true);

    const relayedOffer = nextMessage(second.socket, (message) => message.type === 'offer');
    first.socket.send(JSON.stringify({
      type: 'offer',
      targetId: second.registered.deviceId,
      signal: 'v1.offer:test-sdp',
    }));
    assert.equal((await relayedOffer).signal, 'v1.offer:test-sdp');
    assert.ok(sent.requestId);
  } finally {
    for (const socket of clients) socket.close();
    await service.close();
  }
});

test('signaling server relays ICE candidates only between authorized peers', async () => {
  const service = createSignalingServer({ port: 0, allowedOrigins: 'http://localhost' });
  const address = await service.listen();
  const url = `ws://127.0.0.1:${address.port}/p2p`;
  const clients = [];
  let stage = 'registering peers';
  try {
    const first = await connectClient(url, 'Laptop');
    const second = await connectClient(url, 'Phone');
    const third = await connectClient(url, 'Tablet');
    clients.push(first.socket, second.socket, third.socket);

    const connectionRequest = nextMessage(second.socket, (message) => message.type === 'connection-request');
    first.socket.send(JSON.stringify({ type: 'request', targetId: second.registered.deviceId }));
    const request = await connectionRequest;
    const response = nextMessage(first.socket, (message) => message.type === 'connection-response');
    second.socket.send(JSON.stringify({
      type: 'respond',
      requestId: request.requestId,
      accepted: true,
    }));
    await response;

    const candidate = {
      candidate: 'candidate:1 1 udp 2122260223 192.0.2.1 50000 typ host',
      sdpMid: '0',
      sdpMLineIndex: 0,
      usernameFragment: 'test-ufrag',
    };
    stage = 'relaying authorized candidate';
    const relayedCandidate = nextMessage(second.socket, (message) => message.type === 'ice-candidate');
    first.socket.send(JSON.stringify({
      type: 'ice-candidate',
      targetId: second.registered.deviceId,
      candidate,
    }));
    const received = await relayedCandidate;
    assert.deepEqual(received.candidate, candidate);
    assert.equal(received.from.id, first.registered.deviceId);

    const relayedEndOfCandidates = nextMessage(second.socket, (message) => (
      message.type === 'ice-candidate' && message.candidate === null
    ));
    first.socket.send(JSON.stringify({
      type: 'ice-candidate',
      targetId: second.registered.deviceId,
      candidate: null,
    }));
    assert.equal((await relayedEndOfCandidates).candidate, null);

    stage = 'rejecting unauthorized candidate';
    const unauthorizedError = nextMessage(third.socket, (message) => message.type === 'error');
    third.socket.send(JSON.stringify({
      type: 'ice-candidate',
      targetId: second.registered.deviceId,
      candidate,
    }));
    assert.match((await unauthorizedError).message, /Không thể chuyển/);

    stage = 'rejecting malformed candidate';
    const invalidCandidateError = nextMessage(second.socket, (message) => message.type === 'error');
    second.socket.send(JSON.stringify({
      type: 'ice-candidate',
      targetId: first.registered.deviceId,
      candidate: { candidate: 'x'.repeat(4097), sdpMid: '0', sdpMLineIndex: 0 },
    }));
    assert.match((await invalidCandidateError).message, /Không thể chuyển/);
  } catch (error) {
    error.message = `${stage}: ${error.message}`;
    throw error;
  } finally {
    for (const socket of clients) socket.close();
    await service.close();
  }
});

test('signaling server exposes a health endpoint', async () => {
  const service = createSignalingServer({ port: 0 });
  const address = await service.listen();
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  } finally {
    await service.close();
  }
});
